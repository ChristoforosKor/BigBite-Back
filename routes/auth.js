const Joi = require("joi");
const bcrypt = require("bcrypt");
const ENTITY = require("./entities").SESSIONS;
const _ = require("lodash");
const {User} = require("../models/schemas/users");
const {organizationModel} = require("../models/schemas/organizations");
const errorResponse = require("../lib/errorresponse");
const express = require("express");
const logger = require("../lib/logger");
const {checkMobile} = require("../lib/checkMobile");
const jwt = require("jsonwebtoken");
const config = require("config");
const permissionsOptions = require("../lib/permissionsoptions");
const axios = require('axios');
const router = express.Router();
const mongoose = require('mongoose');

const {
    setSessionData,
    flattenPermissions,
    anonymousSessionData,
    getSessionData
} = require("../lib/sessionstorage");
const CodeError = require("../lib/errors/CodeError");

const {
    sessionModel,
    sessionValidate,
    tokenValidate
} = require("../models/schemas/sessions");

const refreshClientSessionByUserId = async (userId) => {
    return await sessionModel.refreshByUserId(userId);
};

const clientSession = () => {
    return sessionModel.clientSession();
};

const create = async (data) => {
    sessionValidate(data);
    setSessionData(data);
    const session = await sessionModel.create(data);
    return session;
};
const findChildren = async(id) => {
    const result = await organizationModel.aggregate([
        {
            $match: {_id: new mongoose.Types.ObjectId(id)}
        },
        {
            $graphLookup: {
                from: 'organizations',
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'organization._id',
                as: 'allChildren'
            }
        },
        {
            $project:
                    {
                        children: '$allChildren._id'
                    }
        }
    ]);
    const allChildren = result.flatMap(doc => doc.children || []).map(_id => _id.toString());

    return allChildren;
};

module.exports.create = create;
const createData = async (user) => {
    const {tempToken, refreshToken, tempDecoded, refreshDecoded} = createTokens(user);
    const permissions = flattenPermissions(user);
    const sessionData = {
        refreshToken: refreshToken,
        tempToken: tempToken,
        session: {
            user: {
                _id: user._id,
                username: user.username,
                roles: user.roles
            },
            permissions: permissions
        },
        organization: { _id: user.organization._id.toString(),  organizationName: user.organization.organizationName},
        organizationChildren: await findChildren(user.organization._id.toString()),
        ip: "1.1.1.1",
        loginAt: new Date(tempDecoded.iat * 1000),
        expiresAt: new Date(tempDecoded.exp * 1000),
        refreshExpiresAt: new Date(refreshDecoded.exp * 1000),
        createdBy: {_id: user._id.toString(), username: user.username}
    };
    return sessionData;
};

const userPopulationParams = {
    path: "roles",
    select: "_id role permissions, category",
    populate: {
        path: "permissions"
    }
};

const login = async (data) => {
    try {
        const userModel = await userExists(data.email);
        if (userModel) {
            const sessionData = await createData(userModel);
            const sesdata = await create(sessionData);
            const final_data = {
                expiresAt: sesdata.expiresAt,
                refreshExpiresAt: sesdata.refreshExpiresAt,
                user_id: sesdata.session.user._id,
                detailedPermissions: sesdata.session.permissions,
                actions: calculateActions(sesdata.session.permissions),
                token: sesdata.tempToken,
                refreshToken: sesdata.refreshToken
            };
            return final_data;
        }
    } catch (error) {
        return error;
    }
};

router.post("/", async (req, res) => {
    try {
//    const { error } = validate(req.body);
//    if (error) return res.status(400).send(error.details[0].message);
        //const clock_token = req.body.token;
        //const decoded = jwtDecode(clock_token);
        let user = await User.findOne({username: req.body.username}).populate(
                userPopulationParams
                );
        ;
        if (!user)
            throw new CodeError("Λάθος username ή κωδικός", 40100);


        if ((!user.password) && (user.provider !== "recycle")) {
            throw new CodeError('Συνδεθείτε <a href="https://logintest.gr" target="_blank">εδώ</a>', 40100);
        }//else if((!user.paswword) & ( user.provider ==="recycle")){
//              throw new CodeError("Για να συνδεθείτε αλλάξτε τον κωδικό σας", 40100);
//        }
        const validPassword = await bcrypt.compare(
                req.body.password,
                user.password,
                );
        if (!user.isConfirmed)
            throw new CodeError("Αυτός ο χρήστης δεν είναι επαληθευμένος", 40100);
        if (!validPassword)
            throw new CodeError("Λάθος username ή κωδικός", 40100);
        const sessionData = await createData(user);
        const sesdata = await create(sessionData);

        const final_data = {
            expiresAt: sesdata.expiresAt,
            refreshExpiresAt: sesdata.refreshExpiresAt,
            user_id: sesdata.session.user._id,
            detailedPermissions: sesdata.session.permissions,
            actions: calculateActions(sesdata.session.permissions),
            token: sesdata.tempToken,
            refreshToken: sesdata.refreshToken
        };
        res.status(200).send(final_data);
    } catch (error) {
        errorResponse(res, error);
    }
});

router.post("/logout", async (req, res) => {
    try {
        const token = req.header(config.get("jwtPrivateKey"));
        const result = sessionModel.logout(token);
        res.status(204).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

const createTokens = (user) => {
    const tempToken = user.generateTempToken();
    const tempDecoded = jwt.verify(tempToken, config.get("jwtPrivateKey"));
    const refreshToken = user.generateRefreshToken();
    const refreshDecoded = jwt.verify(
            refreshToken,
            config.get("refreshTokenKey"),
            );

    return {
        tempToken: tempToken,
        refreshToken: refreshToken,
        tempDecoded: tempDecoded,
        refreshDecoded: refreshDecoded
    };
};

router.get("/token/:token", async (req, res) => {
    try {
        const result = await sessionModel.findByToken(req, res);
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

router.post("/refresh/:id", async (req, res) => {
    try {

        const userId = req.params.id;
        const tempToken = req.header(config.get("jwtPrivateKey"));
        const refreshToken = req.header(config.get("refreshTokenKey"));

        const sessionData = await sessionModel.refreshSession(
                tempToken,
                refreshToken,
                userId,
                );


        res.setHeader(config.get("jwtPrivateKey"), sessionData.tempToken);
        res.setHeader(config.get("refreshTokenKey"), sessionData.refreshToken);

        res.status(200).send({
            expiresAt: sessionData.expiresAt,
            refreshExpiresA: sessionData.refreshExpiresAt,
            user_id: sessionData.session.user._id,
            detailedPermissions: sessionData.session.permissions,
            actions: calculateActions(sessionData.session.permissions),
            token: sessionData.tempToken,
            refreshToken: sessionData.refreshToken
        });
    } catch (error) {

        errorResponse(res, error);
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const result = await sessionModel.delete(req, res);
        res.status(204).send();
    } catch (error) {
        errorResponse(res, error);
    }
});

const calculateActions = (permissions) => {
    return permissions.map((item) => {
        const newItem = {
            entity: item.entity,
            actions: {
                create: item.allowed.includes(permissionsOptions.CREATE),
                read: canDo(item.allowed, permissionsOptions.actionGroups.read),
                update: canDo(item.allowed, permissionsOptions.actionGroups.update),
                delete: canDo(item.allowed, permissionsOptions.actionGroups.delete),
                change_creator: item.allowed.includes(
                        permissionsOptions.CHANGE_CREATOR,
                        ),
                change_updater: item.allowed.includes(
                        permissionsOptions.CHANGE_UPDATER,
                        ),
                change_organization: item.allowed.includes(
                        permissionsOptions.CHANGE_ORGANIZATION,
                        ),
                change_organization_creator: item.allowed.includes(
                        permissionsOptions.CHANGE_ORGANIZATION_CREATOR,
                        ),
                change_organization_updater: item.allowed.includes(
                        permissionsOptions.CHANGE_ORGANIZATION_UPDATER,
                        )
            }
        };
        return newItem;
    });
};

const canDo = (entityPermissions, actionOptions) => {
    return entityPermissions.some((permission) =>
        actionOptions.includes(permission),
            );
};

async function decodeTokens(tempToken, refreshToken) {
    let result = {};
    if (tempToken) {
        try {
            result.tempToken = await jwt.verify(
                    tempToken,
                    config.get("jwtPrivateKey"),
                    {ignoreExpiration: true},
                    );
        } catch (err) {
            result.tempToken = {_id: ""};
        }
    }
    if (refreshToken) {
        try {
            result.refreshToken = await jwt.verify(
                    refreshToken,
                    config.get("refreshTokenKey"),
                    );
        } catch (err) {
            result.refreshToken = {_id: ""};
        }
    }

    return result;
}
let cachedPublicKey = null;

async function getRealmPublicKey() {
    if (cachedPublicKey)
        return cachedPublicKey;

    const res = await axios.get(`${config.get("realmUrl")}`);
    const key = res.data.public_key;
    if (!key)
        throw new Error('public key not found in realm config');

    // format to PEM
    const pem = `-----BEGIN PUBLIC KEY-----\n${key.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----\n`;
    cachedPublicKey = pem;
    return pem;
}


router.get("/callback/:suffix", async (req, res) => {
    callback(req, res, req.params.suffix);
});

async function callback(req, res, suffix) {
    
    const {code} = req.query;
    if (!code)
        return res.status(400).send('missing code');
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', config.get("redirectUri") + '/' + suffix);
        params.append('client_id', config.get("clientId"));
        params.append('client_secret', config.get("clientSecret"));
        const response = await axios.post(config.get("tokenUrl"), params);
        const token = response.data.access_token;
        const publicKey = await getRealmPublicKey();
        const decoded = jwt.verify(token, publicKey, {algorithms: ['RS256']});
//    const token = response.data;
//    res.json({
//      message: 'login successful',
//      access_token: token.access_token,
//      whole_token: token,
//      id_token: token.id_token,
//    });
        const exists = await userExists(decoded.email);
        console.log(req.query);
        const mobile = checkMobile(req);
        console.log('ok-1');
        if (exists) {
            console.log('ok-2');
            const result = await login(decoded);
            res.cookie('ac', result.token, {
                secure: true,
                sameSite: 'None',
                domain: 'recyclebin.mnss.eu'
            });
            res.cookie('rf', result.refreshToken, {
                secure: true,
                sameSite: 'None',
                domain: 'recyclebin.mnss.eu'
            });
            console.log('ok1');
            if (mobile) {
               console.log('ok2');
               const mobile_url = new URL(config.get("mobile_url"));
               let data = { _id:  exists._id, username: exists.username};
                data.exists = true;
                const response_params = new URLSearchParams(data);
                mobile_url.search = response_params.toString();
                console.log("redirect url is: " + mobile_url.toString());
                res.redirect(mobile_url.toString());
            } else {
                console.log('ok3');
                console.log(config.get('front_url'));
                res.redirect("http://recyclebin.mnss.eu");
            }

        } else {
            const data = {
                email: decoded.email,
                firstName: decoded.given_name,
                lastName: decoded.family_name,
                username: decoded.preferred_username,
                exists: false
            };
            res.cookie('ssoinfo', data, {
                secure: true,
                sameSite: 'None',
                domain: 'recyclebin.mnss.eu'
            });

            if (mobile) {
                const mobile_url = new URL(config.get("mobile_url"));
                const response_params = new URLSearchParams(data)
                

                mobile_url.search = response_params.toString();
                console.log("redirect url is: " + mobile_url.toString());
                res.redirect(mobile_url.toString());
            } else {
                res.redirect(`${config.get('front_url')}/#/sign-up`);
            }
        }

    } catch (err) {
        console.error('token exchange failed', err.response?.data || err.message);
        res.status(500).send('token exchange failed');
    }
}

router.get('/login/:kc_idp_hint', (req, res) => {
    const authUrl = `${config.get("realmUrl")}` +
//            `/protocol/openid-connect/auth?client_id=${config.get("clientId")}` +
            `/protocol/openid-connect/auth?client_id=expo-mobile` +
            `&response_type=code&scope=openid&redirect_uri=${encodeURIComponent(config.get("redirectUri")) + '/' + req.params.kc_idp_hint[0]}` +
            `&kc_idp_hint=${req.params.kc_idp_hint}${req.params.kc_idp_hint==='google' ? 'prompr=select_account': ''}`;
            if(req.query.debug) {
                console.log(authUrl);
                return;
            }
    res.redirect(authUrl);
});

async function userExists(email) {
    let user = await User.findOne({username: email}).populate(
            userPopulationParams,
            );
    if (!user) {
//        throw new CodeError("Δεν έχεις κάνει εγγραφή", 40100);
        return false;
    } else {
        return user;
    }
}

module.exports = router;

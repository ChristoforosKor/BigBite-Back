const ENTITY = require('./entities').SESSIONS;
const {sessionModel, sessionValidate, tokenValidate} = require('./schemas/sessions');
const validateId = require('../lib/validateId');
const userModel = require('../models/users');
const encrypt = require('../lib/encrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('config');
const HttpError = require('../lib/errors/HttpError');
const utilsArrays = require('../lib/utilsarrays');
const {setSessionData, flattenPermissions, anonymousSessionData, getSessionData} = require('../lib/sessionstorage');
const permissionsOptions = require('../lib/permissionsoptions');

const create = async (data) => {
    sessionValidate(data);
    setSessionData(data);
    return await sessionModel.create(data);
};

const createData = (user) => {
    const {tempToken, refreshToken, tempDecoded, refreshDecoded} = createTokens(user);


    const permissions = flattenPermissions(user);
 
    const sessionData = {
        refreshToken: refreshToken,
        tempToken: tempToken,
        session: {
            user: {
                _id: user._id,
                fullname: user.fullname,
                roles: user.roles
            },
            permissions: permissions
        },
        organization: user.organization.toString(),
        ip: '1.1.1.1',
        loginAt: new Date(tempDecoded.iat * 1000),
        expiresAt: new Date(tempDecoded.exp * 1000),
        refreshExpiresAt: new Date(refreshDecoded.exp * 1000),
        createdBy: user._id.toString()
    };
    return sessionData;
};


const userPopulationParams = {
   
    path: 'roles',
    select: '_id role permissions, category',
    populate: {
        path: 'permissions'
    }
               
};

module.exports.login = async (data) => {
    const user = await userModel.findByLogin(data.login, null, userPopulationParams );
    
    if (!user)
        throw new HttpError('Invalid Credentials', 401);
    const validPassword = await encrypt.validHashWithSalt(data.password, user.password, user.salt);
    if (!validPassword)
        throw new HttpError('Invalid credentials', 401);

    const sessionData = createData(user);
    
    //  @TODO Automate common fields like organization
    return await create(sessionData);
};

const refreshSession = async (tempToken, refreshToken, user_id) => {
   
    if (!tempToken || !refreshToken) throw new HttpError('Access Denied. Invalid token.', 401);
    const decoded = await decodeTokens(tempToken, refreshToken);
    if (decoded.tempToken._id !== decoded.refreshToken._id) throw new HttpError('Access Denied. Invalid tokens.', 401);
    if (user_id && decoded.tempToken._id !== user_id) throw new HttpError('Access Denied. User not valid', 401);
    const existingUser = await userModel.findByIdForRefresh(decoded.refreshToken._id, null, userPopulationParams );
    if (!existingUser) throw new HttpError('User does not exists', 401);
    const existingSession = await sessionModel.findOne({tempToken: tempToken, refreshToken: refreshToken});
    if (!existingSession) throw new HttpError('User not loged in', 401);
    const sessionData = createData(existingUser);
   
    sessionValidate(sessionData);
    setSessionData(sessionData);
    existingSession.tempToken = sessionData.tempToken;
    existingSession.refreshToken = sessionData.refreshToken;
    existingSession.refreshedAt = new Date();
    await existingSession.save();
    return sessionData;

};

const createTokens = (user) => {
    const tempToken = user.generateTempToken();
    const tempDecoded = jwt.verify(tempToken, config.get('tempTokenKey'));
    const refreshToken = user.generateRefreshToken();
    const refreshDecoded = jwt.verify(refreshToken, config.get('refreshTokenKey'));

    return {
        tempToken: tempToken,
        refreshToken: refreshToken,
        tempDecoded: tempDecoded,
        refreshDecoded: refreshDecoded
    };
};


async function decodeTokens(tempToken, refreshToken) {

    let result = {};
    if (tempToken) {
        try {
            result.tempToken = await jwt.verify(tempToken, config.get('tempTokenKey'), {ignoreExpiration: true});
        } catch (err) {
            result.tempToken = {'_id': ''};
        }
    }
    if (refreshToken) {
        try {

            result.refreshToken = await jwt.verify(refreshToken, config.get('refreshTokenKey'));
        } catch (err) {
            result.refreshToken = {'_id': ''};
        }
    }

    return result;
}

const deleteByToken = async (token) => {
    return await sessionModel.findOneAndDelete({tempToken: token});
};

const sessionDataByUser = (user_id) => {
    
//            expiresAt: sessionData. expiresAt,
//            refreshExpiresA: sessionData.refreshExpiresAt,
//            user_id: sessionData.session.user._id,
//            detailedPermissions: sessionData.session.permissions,
//            actions: calculateActions(sessionData.session.permissions),
//            token: sessionData.tempToken,
//            refreshToken: sessionData.refreshToken
//        }
}

const onlyPermission = (allowed, ownPermission, otherPermissions) => {
    return allowed.includes(ownPermission) && 
           !otherPermissions.some(permission => allowed.includes(permission));
};

const updateOnlyOrg = (item) => {
   return onlyPermission( item.allowed,permissionsOptions.UPDATE_ORGANIZATION,[permissionsOptions.UPDATE]);
}

const deleteOnlyOrg = (item) => {
    return onlyPermission( item.allowed,permissionsOptions.DELETE_ORGANIZATION,[permissionsOptions.DELETE]);
}


const updateOnlyOwn = (item) => {
    return onlyPermission( item.allowed,permissionsOptions.UPDATE_OWN,[permissionsOptions.UPDATE, permissionsOptions.UPDATE_ORGANIZATION]);
}

const deleteOnlyOwn = (item) => {
    return onlyPermission( item.allowed,permissionsOptions.DELETE_OWN,[permissionsOptions.DELETE, permissionsOptions.DELETE_ORGANIZATION]);
}


const calculateActions = (permissions) => {
    
    return permissions.map(item => {
       
        const newItem =  {
            entity: item.entity,
            actions: {
                create : item.allowed.includes(permissionsOptions.CREATE),
                read: canDo(item.allowed,   permissionsOptions.actionGroups.read),
                update: canDo(item.allowed, permissionsOptions.actionGroups.update),
                delete: canDo(item.allowed, permissionsOptions.actionGroups.delete),
                update_only_org: updateOnlyOrg(item),
                delete_only_org: deleteOnlyOrg(item),
                update_only_own: updateOnlyOwn(item),
                delete_only_own: deleteOnlyOwn(item),
                change_creator: item.allowed.includes(permissionsOptions.CHANGE_CREATOR),
                change_updater: item.allowed.includes(permissionsOptions.CHANGE_UPDATER),
                change_organization: item.allowed.includes(permissionsOptions.CHANGE_ORGANIZATION),
                change_organization_creator: item.allowed.includes(permissionsOptions.CHANGE_ORGANIZATION_CREATOR),
                change_organization_updater: item.allowed.includes(permissionsOptions.CHANGE_ORGANIZATION_UPDATER)               
            }
        };
        return newItem;
    });
};

const canDo = (entityPermissions, actionOptions) => {
    
    return entityPermissions.some(permission => 
        actionOptions.includes(permission)
    );
};






module.exports.refreshSession = refreshSession;
module.exports.create = create;

module.exports.findByToken = async (token, projection) => {
    tokenValidate(token);
    return await sessionModel.findOne({tempToken: token}, projection);
};


module.exports.logout = (token) => {
    deleteByToken(token);
    setSessionData(anonymousSessionData);
};


module.exports.refreshByUserId = async (userId) => {
    const sessionData = getSessionData();
    const tempToken = sessionData.tempToken;
    const refreshToken = sessionData.refreshToken;
    const newSessionData = await refreshSession(tempToken, refreshToken, userId);
    
//    const actionsPermissions =  calculateActions(sessionData.session.permissions),
    const userSession = {
                expiresAt: newSessionData.expiresAt,
                refreshExpiresA: newSessionData.refreshExpiresAt,
                user_id: newSessionData.session.user._id,
                detailedPermissions: newSessionData.session.permissions,
                actions: calculateActions(newSessionData.session.permissions),
                token: newSessionData.tempToken,
                refreshToken: newSessionData.refreshToken
        };
    

    return userSession;
    
};

module.exports.clientSession = () => {
    
    const sessionData = getSessionData();
    const userSession = {
                expiresAt: sessionData.expiresAt,
                refreshExpiresA: sessionData.refreshExpiresAt,
                user_id: sessionData.session.user._id,
                detailedPermissions: sessionData.session.permissions,
                actions: calculateActions(sessionData.session.permissions),
                token: sessionData.tempToken
//                refreshToken: sessionData.refreshToken
    };
    
    return userSession;
};




let cachedPublicKey = null;

async function getRealmPublicKey() {
  if (cachedPublicKey) return cachedPublicKey;
  const res = await axios.get(`${config.get("realmUrl")}`);
  const key = res.data.public_key;
  if (!key) throw new Error('public key not found in realm config');
  // format to PEM
  const pem = `-----BEGIN PUBLIC KEY-----\n${key.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----\n`;
  cachedPublicKey = pem;
  return pem;
}

module.exports.loginExternal = async (code) => {
     const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', config.get("redirectUri"));
        params.append('client_id', config.get("clientId"));
        params.append('client_secret', config.get("clientSecret"));
        const response = await axios.post(config.get("tokenUrl"), params);
        const token = response.data.access_token;
       const publicKey = await getRealmPublicKey();
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        return await login(decoded);


};


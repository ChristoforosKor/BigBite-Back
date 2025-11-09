const jwt = require('jsonwebtoken');
const config = require('config');
const sessionModel = require('../models/sessions');
const HttpError = require('../lib/errors/HttpError');
const errorResponse = require('../lib/errorresponse');
const permissionsOptions = require('../lib/permissionsoptions');
const stateOptions = require('../lib/stateoptions');
const defaultOptions = require('../lib/defaultoptions');
const {asyncLocalStorage, setSessionData, getSessionData, anonymousSessionData} = require('../lib/sessionstorage');

const requestMiddleware = (req, res, next) => {
    const store = new Map();
   
    asyncLocalStorage.run(store,async () => {
        await doAsyncWork(req, res, next);
    });
};

const doAsyncWork = async (req, res, next) => {
    try {
        const token = req.header(config.get('jwtPrivateKey'));
        if (token && !req.originalUrl.includes('/sessions/refresh')) {
            await jwt.verify(token, config.get('jwtPrivateKey'));
        }
        const sessionData = await createSessionData(token);
        setSessionData(sessionData);
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            error.httpStatus = 401;
        }
        if (!res.headersSent) {
            errorResponse(res, error);
        }
    }
};

const createSessionData = async (token) => {
    let sessionData;
    if (token) {
        sessionData = await sessionModel.findByToken(token);
    }
    if (sessionData) {
        return sessionData.toObject();
    }
    return anonymousSessionData();
};

module.exports = {
    requestMiddleware
};
const validateId = require('../lib/validateId');
const {sessionModel, sessionValidate} = require('../models/sessions');


const getId = (req, strict = true ) => {
    validateId(req.params.id);
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};


const refreshClientSessionByUserId = async (userId) => {
    return await sessionModel.refreshByUserId(userId);
    
};

const clientSession = () => {
  return sessionModel.clientSession();
};


module.exports.loginExternal = async (req) => {
     const {code} = req.query;
    return await sessionModel.loginExternal(code);
};

module.exports.login = async function (req) {
  return await sessionModel.login(req.body)
};
module.exports.refreshSession =  async (tempToken, refreshToken, user_id) => {
   
    if ( !tempToken || !refreshToken) {
        throw new Error('Access Denied. Invalid Token'); 
    }
    return await sessionModel.refreshSession(tempToken, refreshToken, user_id);
        
 };
 
  
module.exports.refreshClientSessionByUserId = refreshClientSessionByUserId;
  
module.exports.clientSession = clientSession;
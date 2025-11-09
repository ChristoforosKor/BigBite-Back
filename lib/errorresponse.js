const logger = require('./logger');

module.exports = (res, error) => {
    let status;
    logger.logError(error);
    if (error.code) status = codeToStatus(error.code); 
    if (status) return res.status(status).send(error.message);
    if (error.httpStatus) return res.status(error.httpStatus).send(error.message);
     if (error.status) return res.status(error.status).send(error.message);
    
    return res.status(500).send(error.message);
};


const codeToStatus= (code) => {
//    console.log(code);
    return code.toString().substring(0,3);
};
const winston = require('winston');
const config = require('config');
const TAG = config.get('TAG');
const {combine, timestamp, json, prettyPrint, errors, cli, simple} = winston.format;
const logLocation = config.get('logLocation');
require('express-async-errors');



const transportFormat = {
    format: combine(
            errors({stack: true}),
            timestamp(),
//            prettyPrint(),
            json()
        )
    };

const loggerConfig = (level, service, fileName) => {

    return {
        level: level,
        format: combine(
            errors({stack: true}),
            timestamp(),
   //         prettyPrint(),
             json()
        ),
        transports: [
            new winston.transports.Console(transportFormat),
            new winston.transports.File({
                filename: logLocation + '/' + fileName,
                format: transportFormat.format
            })
        ],
        exceptionHandlers: [
            new winston.transports.Console(),
            new winston.transports.File({filename: logLocation + '/uncaught.log'})
        ],
        rejectionHandlers: [
            new winston.transports.Console(),
            new winston.transports.File({filename: logLocation + '/rejected.log'})
        ],
        defaultMeta: {service: service}
    };
};

winston.loggers.add(TAG, loggerConfig('info', TAG, `${TAG}.log`));


const log = (service, level, logEntry) => {
    winston.loggers.get(service).log(level, logEntry);
};

const logInfo = (logEntry) => {
    winston.loggers.get(TAG).log('info', logEntry);
};

const logError = (logEntry) => {
    winston.loggers.get(TAG).log('error', logEntry);
};


module.exports.logInfo = logInfo;
module.exports.logError = logError;
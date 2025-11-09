


const winston = require('winston');
require('express-async-errors');


module.exports = function (config) {
    
    winston.add(new winston.transports.File({
        filename: config.get('logFile'),
        format: winston.format.combine(
                winston.format.timestamp({
                    format: "YYYY-MM-DD HH:mm:ss"
                }),
                winston.format.json()
                )}));
    
    winston.add(new winston.transports.Console({colorize:true, prettyPrint: true}));

    winston.exceptions.handle(
            new winston.transports.File({
                filename: config.get('uncaughtLogFile')
            }));
            
    winston.exceptions.handle(new winston.transports.Console({colorize:true, prettyPrint: true}));
    process.on('unhandledRejection', (ex) => {
        throw ex;
    });

};
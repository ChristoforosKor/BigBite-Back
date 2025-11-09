const winston = require('winston');
const config = require('config');

module.exports = function(err, req, res, next) {
    winston.log(config.get('logLevel'), err.message, err);
    res.status(500).send('Something failed');
};
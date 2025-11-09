const winston = require('winston');
const mongoose = require('mongoose');
const config = require('config');


const connect = async () => {
    try {
        await mongoose.connect(config.get("db"));
        winston.info('Connected to MongoDB...');
       
    } catch (err) {
        winston.error('MongoDB connection failed:', err);
        throw err;
    }
};

const disconnect = async () => {
    await mongoose.connection.close();
    winston.info('Connection to MongoDB is closed');
};

module.exports = {
    connect,
    disconnect
};

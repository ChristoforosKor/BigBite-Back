const winston = require('winston');
const app = require('./app');
const {connect} = require('./startup/db');
//const recycleMediator = require('./dbstreams/mediator');

const port = process.env.RECYCLE_MIDDLEWARE_PORT || 30000;


const startServer = async () => {
  try {
    await connect();
    require('./dbstreams/bootstrap');
    const server = app.listen(port, () => {
      winston.info(`Waste bin started on port ${port}`);
    });
    
    return server;
  } catch (err) {
    winston.error('Failed to start server:', err);
    process.exit(1);
  }
};

module.exports = startServer;

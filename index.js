const startServer  = require('./main');

startServer().catch((err) => {
   console.error('Failed to start server: ', err);
   process.exit(1);
});


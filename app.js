// app.js
const express = require('express');
const config = require('config');

const cors = require('cors');
const { requestMiddleware } = require('./middleware/auth');
const makeFilterNormalizer = require('./factories/makeFilterNormalizer');
const makeMongoFilterFromTokens = require('./factories/makeMongoFilterFromTokens');

const corsOptions = {
  origin: "*",
  methods: "GET,POST,OPTIONS,PUT,DELETE,PATCH",
  allowedHeaders: "Authorization,Accept,Origin,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range, X-CSRF-Token, x-recyclebin-jwtprivatekey, x-recyclebin-refresh-token"
};

const app = express();
app.use(express.json());
app.use(require('express-useragent').express());
//app.use(cors(corsOptions));
app.use(requestMiddleware);
app.use(makeFilterNormalizer());
app.use(makeMongoFilterFromTokens());

require('./startup/config')(config);
require('./startup/logging')(config);
require('./startup/routes')(app, config);
require('./startup/validation')();
require('./startup/mqttConnect')();
//require('./startup/insertData')();  //@TODO It shuld be in seperate migration script
// require('./startup/mqttConnect')();


module.exports = app;

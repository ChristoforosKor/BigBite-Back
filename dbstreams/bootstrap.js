const fs = require('fs');
const path = require('path');
const winston = require('winston');
const mediator = require('./mediator');

const handlersDir = path.join(__dirname, 'handlers');
const streamsDir = path.join(__dirname, 'streams');


//Register collection handlers
fs.readdirSync(handlersDir)
  .filter(file => file.endsWith('.syncHandler.js'))
  .forEach(file => {
    
    const { events, handle } = require(path.join(handlersDir, file));
    
    if (!events || !handle || typeof handle !== 'function') {
        winston.warn(`Skipping ${file}: missing exports { events, handle}`);
        return;
    }
    
    events.forEach(event => {
       mediator.onAsync(event, handle);
       winston.info(`Register ${file} for event ${event}`);
    });    
  });


//Start available streams

fs.readdirSync(streamsDir)
  .filter(file => file.endsWith('.changeStream.js'))
  .forEach(file => {
    const mod = require(path.join(streamsDir, file));
    if ( !mod.name || !mod.model ) {
        winston.warn(`Skipping ${file}: missing {name, model}`);
        return;
    }
    
    const stream = mod.model.watch([], mod.watchOptions || {});
    stream.on('change', change => {
       const op = change.operationType;
       if (['insert', 'update', 'replace', 'delete'].includes(op)) {
           mediator.emit(mod.name, change);
       }
    });
    
    stream.on('error', err => winston.error(`ChangeStream error in ${file}: `, err));
    winston.info(`Watching "${mod.colletion || mod.model.modelName}" -> emits "${mod.name}"`);
    
  });
  
  
  

module.exports = mediator;

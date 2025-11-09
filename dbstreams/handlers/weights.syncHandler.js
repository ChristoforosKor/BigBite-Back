const mongoose = require('mongoose');
const winston = require('winston');
const { Weight } = require('../../models/schemas/weights');

const subHandlers = {
  colors: (change, op) => {
    const colorId = new mongoose.Types.ObjectId(change.documentKey._id);
    if (op === 'update') {
      const updatedFields = change.updateDescription?.updatedFields || {};
      const setMap = {};

      for (const [field, value] of Object.entries(updatedFields)) {
        if (['color', 'type'].includes(field))
          setMap[`color.${field}`] = value;
      }

      if (!Object.keys(setMap).length) return Promise.resolve();

      return Weight.updateMany(
        { 'color._id': colorId },
        { $set: setMap }
      )
      .then(() => {
        winston.info(`📍Synced ${Object.keys(setMap).join(', ')} for color ${colorId}`);
      });
    }

    if (op === 'delete') {
      return Weight.updateMany(
        { 'color._id': colorId },
        { $unset: { color: '' } }
      )
      .then(result => {
        winston.info(`Removed color ${colorId} from ${result.modifiedCount} Weights`);
      });
    }

    return Promise.resolve();
  },

  devices: (change, op) => {
    const deviceId = new mongoose.Types.ObjectId(change.documentKey._id);

    if (op === 'update') {
      const updatedFields = change.updateDescription?.updatedFields || {};
      const setMap = {};

      for (const [field, value] of Object.entries(updatedFields)) {
        if (['title'].includes(field))
          setMap[`device.${field}`] = value;
      
       if (['type.type'].includes(field))
          setMap[`device.type`] = value;
      }
      if (!Object.keys(setMap).length) return Promise.resolve();

      return Weight.updateMany(
        { 'device._id': deviceId },
        { $set: setMap }
      )
      .then(() => {
        winston.info(`📍Synced ${Object.keys(setMap).join(', ')} for device ${deviceId}`);
      });
    }

    if (op === 'delete') {
      return Weight.updateMany(
        { 'device._id': deviceId },
        { $unset: { device: '' } }
      )
      .then(result => {
        winston.info(`Removed device ${deviceId} from ${result.modifiedCount} Weights`);
      });
    }

    return Promise.resolve();
  },
    collectionpoints: (change, op) => {
    const cpId = new mongoose.Types.ObjectId(change.documentKey._id);

    if (op === 'update') {
      const updatedFields = change.updateDescription?.updatedFields || {};
      const setMap = {};
      for (const [field, value] of Object.entries(updatedFields)) {
        if (['title', 'addresses'].includes(field))
          setMap[`collectionPoint.${field}`] = value;
      }
      

      if (!Object.keys(setMap).length) return Promise.resolve();

      return Weight.updateMany(
        { 'collectionPoint._id': cpId },
        { $set: setMap }
      )
      .then(() => {
        winston.info(`📍Synced ${Object.keys(setMap).join(', ')} for cp ${cpId}`);
      });
    }

    if (op === 'delete') {
      return Weight.updateMany(
        { 'collectionPoint._id': cpId },
        { $unset: { collectionPoint: '' } }
      )
      .then(result => {
        winston.info(`Removed cp ${cpId} from ${result.modifiedCount} Weights`);
      });
    }

    return Promise.resolve();
  }
};

module.exports = {
  events: ['collectionPoint.changed', 'device.changed', 'color.changed'],

  // ✅ Now handler returns a Promise but doesn’t await it
  handle: (change) => {
    const coll = change.ns?.coll;
    const op = change.operationType;
    const handler = subHandlers[coll];

    if (!handler) {
      winston.debug(`[WeightsSync] No handler for collection: ${coll}`);
      return Promise.resolve();
    }

    return handler(change, op).catch(err => {
      winston.error(`[WeightsSync:${coll}] Error:`, err);
    });
  }
};

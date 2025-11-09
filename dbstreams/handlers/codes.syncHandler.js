const mongoose = require('mongoose');
const winston = require('winston');
const { codeModel } = require('../../models/schemas/oldBagCodes');

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

      return codeModel.updateMany(
        { 'color._id': colorId },
        { $set: setMap }
      )
      .then(() => {
        winston.info(`📍Synced ${Object.keys(setMap).join(', ')} for color ${colorId}`);
      });
    }

    if (op === 'delete') {
      return codeModel.updateMany(
        { 'color._id': colorId },
        { $unset: { color: '' } }
      )
      .then(result => {
        winston.info(`Removed color ${colorId} from ${result.modifiedCount} Codes`);
      });
    }

    return Promise.resolve();
  },

  users: (change, op) => {
    const userId = new mongoose.Types.ObjectId(change.documentKey._id);

    if (op === 'update') {
      const updatedFields = change.updateDescription?.updatedFields || {};
      const setMap = {};

      for (const [field, value] of Object.entries(updatedFields)) {
        if (['username'].includes(field))
          setMap[`user.${field}`] = value;
      }

      if (!Object.keys(setMap).length) return Promise.resolve();

      return codeModel.updateMany(
        { 'user._id': userId },
        { $set: setMap }
      )
      .then(() => {
        winston.info(`📍Synced ${Object.keys(setMap).join(', ')} for user ${userId}`);
      });
    }

    if (op === 'delete') {
      return codeModel.updateMany(
        { 'user._id': userId },
        { $unset: { user: '' } }
      )
      .then(result => {
        winston.info(`Removed user ${userId} from ${result.modifiedCount} Codes`);
      });
    }

    return Promise.resolve();
  }
};

module.exports = {
  events: ['color.changed', 'user.changed'],

  // ✅ Now handler returns a Promise but doesn’t await it
  handle: (change) => {
    const coll = change.ns?.coll;
    const op = change.operationType;
    const handler = subHandlers[coll];

    if (!handler) {
      winston.debug(`[CodeSync] No handler for collection: ${coll}`);
      return Promise.resolve();
    }

    return handler(change, op).catch(err => {
      winston.error(`[CodeSync:${coll}] Error:`, err);
    });
  }
};

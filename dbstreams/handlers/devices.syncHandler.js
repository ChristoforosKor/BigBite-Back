const mongoose = require('mongoose');
const winston = require('winston');
const { deviceModel } = require('../../models/schemas/devices');

//
// 🧠 Sub-handlers per collection (Promise-based)
//
const subHandlers = {
  devicetypes: (change, op) => {
    const typeId = new mongoose.Types.ObjectId(change.documentKey._id);
    const updated = change.updateDescription?.updatedFields || {};

    if (op === 'update' && updated.type) {
      return deviceModel.updateMany(
        { 'type._id': typeId },
        { $set: { 'type.type': updated.type } }
      )
      .then(result => {
        winston.info(
          `🔄 Renamed DeviceType ${typeId} → "${updated.type}" in ${result.modifiedCount} Devices`
        );
      });
    }

    if (op === 'delete') {
      return deviceModel.updateMany(
        { 'type._id': typeId },
        { $unset: { type: '' } }
      )
      .then(result => {
        winston.info(
          `🧹 Removed deleted DeviceType ${typeId} from ${result.modifiedCount} Devices`
        );
      });
    }

    return Promise.resolve();
  }
};

//
// ✅ Main exported handler — returns Promise (non-blocking)
//
module.exports = {
  events: ['devicetype.changed'],

  handle: (change) => {
    const coll = change.ns?.coll;
    const op = change.operationType;
    const handler = subHandlers[coll];

    if (!handler) {
      winston.debug(`[DeviceSync] No handler for collection: ${coll}`);
      return Promise.resolve();
    }

    return handler(change, op).catch(err => {
      winston.error(`[DeviceSync:${coll}] Error:`, err);
    });
  }
};

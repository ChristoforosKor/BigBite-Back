const mongoose = require('mongoose');
const winston = require('winston');
const { collectionPoint } = require('../../models/schemas/collectionPoints');

/**
 * Unified sync handler for CollectionPoints.
 * Automatically routes by collection name using a handler map.
 */

//
// 🧠 Sub-handlers per collection
//
const subHandlers = {
  addresses: async (change, op) => {
    const addressId = new mongoose.Types.ObjectId(change.documentKey._id);

    if (op === 'update') {
      const updatedFields = change.updateDescription?.updatedFields || {};
      const setMap = {};

      for (const [field, value] of Object.entries(updatedFields)) {
        if (['address', 'latitude', 'longitude'].includes(field))
          setMap[`addresses.${field}`] = value;
      }

      if (Object.keys(setMap).length) {
        await collectionPoint.updateMany(
          { 'addresses._id': addressId },
          { $set: setMap }
        );
        winston.info(`📍Synced ${Object.keys(setMap).join(', ')} for Address ${addressId}`);
      }
    }

    if (op === 'delete') {
      const result = await collectionPoint.updateMany(
        { 'addresses._id': addressId },
        { $unset: { addresses: '' } }
      );
      winston.info(`Removed address ${addressId} from ${result.modifiedCount} CollectionPoints`);
    }
  },

  devices: async (change, op) => {
    const deviceId = new mongoose.Types.ObjectId(change.documentKey._id);

    if (op === 'update') {
      const updatedFields = change.updateDescription?.updatedFields || {};
      const setMap = {};

      for (const [field, value] of Object.entries(updatedFields)) {
        if (['title', 'battery', 'fill', 'type'].includes(field))
          setMap[`devices.$[dev].${field}`] = value;
      }

      if (Object.keys(setMap).length) {
        await collectionPoint.updateMany(
          { 'devices._id': deviceId },
          { $set: setMap },
          { arrayFilters: [{ 'dev._id': deviceId }] }
        );
        winston.info(`Updated devices for ${deviceId} → ${Object.keys(setMap).join(', ')}`);
      }
    }

    if (op === 'delete') {
      const result = await collectionPoint.updateMany(
        { 'devices._id': deviceId },
        { $pull: { devices: { _id: deviceId } } }
      );
      winston.info(`Removed Device ${deviceId} from ${result.modifiedCount} CollectionPoints`);
    }
  },

  devicetypes: async (change, op) => {
    const typeId = new mongoose.Types.ObjectId(change.documentKey._id);
    const updated = change.updateDescription?.updatedFields || {};

    if (op === 'update' && updated.type) {
      const result = await collectionPoint.updateMany(
        { 'devices.type._id': typeId },
        { $set: { 'devices.$[dev].type.type': updated.type } },
        { arrayFilters: [{ 'dev.type._id': typeId }] }
      );
      winston.info(
        `🔄 Renamed DeviceType ${typeId} → "${updated.type}" in ${result.modifiedCount} CollectionPoints`
      );
    }

    if (op === 'delete') {
      const result = await collectionPoint.updateMany(
        { 'devices.type._id': typeId },
        { $pull: { devices: { 'type._id': typeId } } }
      );
      winston.info(`🧹 Removed deleted DeviceType ${typeId} from ${result.modifiedCount} CollectionPoints`);
    }
  }
};

//
// 🧩 Main exported handler
//
module.exports = {
  events: ['address.changed', 'device.changed', 'devicetype.changed'],

  handle: async (change) => {
    const coll = change.ns?.coll;
    const op = change.operationType;

    const handler = subHandlers[coll];
    if (!handler) {
      winston.debug(`[CollectionPointSync] No handler for collection: ${coll}`);
      return;
    }

    try {
      await handler(change, op);
    } catch (err) {
      winston.error(`[CollectionPointSync:${coll}] Error:`, err);
    }
  }
};

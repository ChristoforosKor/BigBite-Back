const mongoose = require('mongoose');
const winston = require('winston');
const { couponsModel } = require('../../models/schemas/coupons');

/**
 * Unified sync handler for coupons.
 * Automatically routes by collection name using a handler map.
 */

//
// 🧠 Sub-handlers per collection
//
const subHandlers = {
  offertypes: async (change, op) => {
    const offerTypeId = new mongoose.Types.ObjectId(change.documentKey._id);

    if (op === 'update') {
      const updatedFields = change.updateDescription?.updatedFields || {};
      const setMap = {};

      for (const [field, value] of Object.entries(updatedFields)) {
        if (['type'].includes(field))
          setMap[`offer_type.${field}`] = value;
      }

      if (Object.keys(setMap).length) {
        await couponsModel.updateMany(
          { 'offer_type._id': offerTypeId },
          { $set: setMap }
        );
        winston.info(`📍Synced ${Object.keys(setMap).join(', ')} for OfferType ${offerTypeId}`);
      }
    }

    if (op === 'delete') {
      const result = await couponsModel.updateMany(
        { 'offer_type._id': offerTypeId },
        { $unset: { offer_type: '' } }
      );
      winston.info(`Removed OfferType ${offerTypeId} from ${result.modifiedCount} Coupons`);
    }
  },

  organizations: async (change, op) => {
    const partnerId = new mongoose.Types.ObjectId(change.documentKey._id);

    if (op === 'update') {
      const updatedFields = change.updateDescription?.updatedFields || {};
      const setMap = {};

      for (const [field, value] of Object.entries(updatedFields)) {
        if (['organizationName'].includes(field))
          setMap[`partner.${field}`] = value;
      }

      if (Object.keys(setMap).length) {
        await couponsModel.updateMany(
          { 'partner._id': partnerId },
          { $set: setMap }
        );
        winston.info(`📍Synced ${Object.keys(setMap).join(', ')} for Partner ${partnerId}`);
      }
    }

    if (op === 'delete') {
      const result = await couponsModel.updateMany(
        { 'partner._id': partnerId },
        { $unset: { partner: '' } }
      );
      winston.info(`Removed Partner ${partnerId} from ${result.modifiedCount} Coupons`);
    }
  }
};

//
// 🧩 Main exported handler
//
module.exports = {
  events: ['offerType.changed', 'partner.changed'],

  handle: async (change) => {
    const coll = change.ns?.coll;
    const op = change.operationType;

    const handler = subHandlers[coll];
    //console.log("EVENT:", coll, op, change.updateDescription?.updatedFields);
    if (!handler) {
      winston.debug(`[couponSync] No handler for collection: ${coll}`);
      return;
    }

    try {
      await handler(change, op);
    } catch (err) {
      winston.error(`[couponSync:${coll}] Error:`, err);
    }
  }
};

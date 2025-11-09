const mongoose = require('mongoose');
const winston = require('winston');
const { couponClaimsModel } = require('../../models/schemas/couponClaims');

/**
 * Unified sync handler for couponClaims.
 * Automatically routes by collection name using a handler map.
 */

//
// 🧠 Sub-handlers per collection
//
const subHandlers = {
  users: async (change, op) => {
    const userId = new mongoose.Types.ObjectId(change.documentKey._id);

    if (op === 'update') {
      const updatedFields = change.updateDescription?.updatedFields || {};
      const setMap = {};

      for (const [field, value] of Object.entries(updatedFields)) {
        if (['username'].includes(field))
          setMap[`user.${field}`] = value;
      }

      if (Object.keys(setMap).length) {
        await couponClaimsModel.updateMany(
          { 'user._id': userId },
          { $set: setMap }
        );
        winston.info(`📍Synced ${Object.keys(setMap).join(', ')} for User ${userId}`);
      }
    }

    if (op === 'delete') {
      const result = await couponClaimsModel.updateMany(
        { 'user._id': userId },
        { $unset: { user: '' } }
      );
      winston.info(`Removed User ${userId} from ${result.modifiedCount} CouponClaims`);
    }
  },

  coupons: async (change, op) => {
    const couponId = new mongoose.Types.ObjectId(change.documentKey._id);

    if (op === 'update') {
      const updatedFields = change.updateDescription?.updatedFields || {};
      const setMap = {};

      for (const [field, value] of Object.entries(updatedFields)) {
        if (['name'].includes(field))
          setMap[`coupon.${field}`] = value;
      }

      if (Object.keys(setMap).length) {
        await couponClaimsModel.updateMany(
          { 'coupon._id': couponId },
          { $set: setMap }
        );
         winston.info(`📍Synced ${Object.keys(setMap).join(', ')} for Coupon ${couponId}`);
      }
    }

    if (op === 'delete') {
      const result = await couponClaimsModel.updateMany(
        { 'coupon._id': couponId },
        { $unset: { coupon: '' } }
      );
      winston.info(`Removed Coupon ${couponId} from ${result.modifiedCount} CouponClaims`);
    }
  }
};

//
// 🧩 Main exported handler
//
module.exports = {
  events: ['user.changed', 'coupon.changed'],

  handle: async (change) => {
    const coll = change.ns?.coll;
    const op = change.operationType;

    const handler = subHandlers[coll];
    //console.log("EVENT:", coll, op, change.updateDescription?.updatedFields);
    if (!handler) {
      winston.debug(`[couponClaimsSync] No handler for collection: ${coll}`);
      return;
    }

    try {
      await handler(change, op);
    } catch (err) {
      winston.error(`[couponClaimsSync:${coll}] Error:`, err);
    }
  }
};

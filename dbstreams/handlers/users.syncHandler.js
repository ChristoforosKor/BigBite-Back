//const mongoose = require('mongoose');
//const winston = require('winston');
//const {User} = require('../../models/schemas/users');
//
//const subHandlers = {
//    discounts: (change, op) => {
//        const discId = new mongoose.Types.ObjectId(change.documentKey._id);
//        const updatedFields = change.updateDescription?.updatedFields || {};
//        const setMap = {};
//
//        if (op === 'update') {
//            for (const [field, value] of Object.entries(updatedFields)) {
//                if (['image', 'name'].includes(field)) {
//                    setMap[`discounts.$[elem].${field}`] = value;
//                }
//            }
//
//            if (!Object.keys(setMap).length)
//                return Promise.resolve();
//
//            return User.updateMany(
//                    {'discounts._id': discId},
//                    {$set: setMap},
//                    {arrayFilters: [{'elem._id': discId}]}
//            )
//                    .then(result => {
//                        winston.info(
//                                `Updated discount ${discId} (${Object.keys(setMap).join(', ')}) in ${result.modifiedCount} Users`
//                                );
//                    })
//                    .catch(err => winston.error(err));
//        }
//
//        if (op === 'delete') {
//            return User.updateMany(
//                    {'discounts._id': discId},
//                    {$pull: {discounts: {_id: discId}}}
//            )
//                    .then(result => {
//                        winston.info(
//                                `Removed discount ${discId} from ${result.modifiedCount} Users`
//                                );
//                    })
//                    .catch(err => winston.error(err));
//        }
//
//        return Promise.resolve();
//    },
//
//    newsletter: (change, op) => {
//        const newslId = new mongoose.Types.ObjectId(change.documentKey._id);
//        const updatedFields = change.updateDescription?.updatedFields || {};
//        const setMap = {};
//
//        if (op === 'update') {
//            for (const [field, value] of Object.entries(updatedFields)) {
//                if (['text'].includes(field)) {
//                    setMap[`newsletter.$[elem].${field}`] = value;
//                }
//            }
//
//            if (!Object.keys(setMap).length)
//                return Promise.resolve();
//
//            return User.updateMany(
//                    {'newsletter._id': newslId},
//                    {$set: setMap},
//                    {arrayFilters: [{'elem._id': newslId}]}
//            )
//                    .then(result => {
//                        winston.info(
//                                `Updated newsletter ${newslId} (${Object.keys(setMap).join(', ')}) in ${result.modifiedCount} Users`
//                                );
//                    })
//                    .catch(err => winston.error(err));
//        }
//
//        if (op === 'delete') {
//            return User.updateMany(
//                    {'newsletter._id': newslId},
//                    {$pull: {newsletter: {_id: newslId}}}
//            )
//                    .then(result => {
//                        winston.info(
//                                `Removed newsletter ${newslId} from ${result.modifiedCount} Users`
//                                );
//                    })
//                    .catch(err => winston.error(err));
//        }
//
//        return Promise.resolve();
//    }
//};
//
//module.exports = {
//    events: ['discount.changed', 'newsletter.changed'],
//
//    handle: (change) => {
//        const coll = change.ns?.coll;
//        const op = change.operationType;
//        const handler = subHandlers[coll];
//
//        if (!handler) {
//            winston.debug(`[UserSync] No handler for collection: ${coll}`);
//            return Promise.resolve();
//        }
//
//        return handler(change, op).catch(err => {
//            winston.error(`[UserSync:${coll}] Error:`, err);
//        });
//    }
//};

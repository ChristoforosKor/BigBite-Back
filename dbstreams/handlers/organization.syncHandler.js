const mongoose = require('mongoose');
const winston = require('winston');
const { organizationModel } = require('../../models/schemas/organizations');

//
// 🧠 Sub-handlers per collection (Promise-based)
//
const subHandlers = {
  colors: (change, op) => {
     const colorId = new mongoose.Types.ObjectId(change.documentKey._id);
        const updatedFields = change.updateDescription?.updatedFields || {};
        const setMap = {};
        if (op === 'update') {
            for (const [field, value] of Object.entries(updatedFields)) {
                if (['color'].includes(field)) {
                    setMap[`colors.$[elem].${field}`] = value;
                }
            }

            if (!Object.keys(setMap).length)
                return Promise.resolve();

            return organizationModel.updateMany(
                    {
                         "colors._id": colorId,
                        organizationType: "municipality"
                    },
                    {$set: setMap},
                    {arrayFilters: [{'elem._id': colorId}]}
            )
                    .then(result => {
                        winston.info(
                                `Updated color ${colorId} (${Object.keys(setMap).join(', ')}) in ${result.modifiedCount} Organizations`
                                );
                    })
                    .catch(err => {
                            winston.error('Error updating color:', {
                              message: err.message,
                              stack: err.stack,
                              colorId,
                              setMap,
                            });
                          });

        }

        if (op === 'delete') {
            return organizationModel.updateMany(
                    {'colors._id': colorId,
                      organizationType: "municipality"
                    },
                    {$pull: {colors: {_id: colorId}}}
            )
                    .then(result => {
                        winston.info(
                                `Removed color ${colorId} from ${result.modifiedCount} Organizations`
                                );
                    })
                    .catch(err => winston.error(err));
        }

        return Promise.resolve();
    },
 partnertypes: (change, op) => {
    const typeId = new mongoose.Types.ObjectId(change.documentKey._id);
    const updated = change.updateDescription?.updatedFields || {};

    if (op === 'update' && updated.type) {
      return organizationModel.updateMany(
        { 'partnerType._id': typeId,
            organizationType: "partner"

},
        { $set: { 'partnerType.type': updated.type } }
      )
      .then(result => {
        winston.info(
          `🔄 Renamed partnerType ${typeId} → "${updated.type}" in ${result.modifiedCount} Organizations`
        );
      });
    }

    if (op === 'delete') {
      return organizationModel.updateMany(
        { 'partnerType._id': typeId },
        { $unset: { partnerType: '' } }
      )
      .then(result => {
        winston.info(
          `🧹 Removed deleted partnerType ${typeId} from ${result.modifiedCount} Organizations`
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
  events: ['color.changed', 'partnertype.changed'],

  handle: (change) => {
    const coll = change.ns?.coll;
    const op = change.operationType;
    const handler = subHandlers[coll];

    if (!handler) {
      winston.debug(`[OrganizationSync] No handler for collection: ${coll}`);
      return Promise.resolve();
    }

    return handler(change, op).catch(err => {
      winston.error(`[OrganizationSync:${coll}] Error:`, err);
    });
  }
};

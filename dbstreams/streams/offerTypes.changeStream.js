const { offerTypesModel } = require('../../models/schemas/offerTypes');


module.exports = {
   name: 'offerType.changed',
   collection: 'offerTypes',
   model: offerTypesModel,
   watchOptions: { fullDocument: 'updateLookup'}
};
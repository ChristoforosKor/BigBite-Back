const { addressModel } = require('../../models/schemas/addresses');


module.exports = {
   name: 'address.changed',
   collection: 'address',
   model: addressModel,
   watchOptions: { fullDocument: 'updateLookup'}
};
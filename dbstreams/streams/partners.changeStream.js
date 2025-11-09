const { organizationModel } = require('../../models/schemas/organizations');


module.exports = {
   name: 'partner.changed',
   collection: 'partners',
   model: organizationModel,
   watchOptions: { fullDocument: 'updateLookup'}
};
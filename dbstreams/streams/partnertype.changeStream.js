const { partnerModel } = require('../../models/schemas/partnerTypes');

module.exports = {
  name: 'partnertype.changed',
  collection: 'partnertypes',
  model: partnerModel,
  watchOptions: { fullDocument: 'updateLookup' }
};

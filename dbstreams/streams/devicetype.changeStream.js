const { deviceTypesModel } = require('../../models/schemas/deviceTypes');

module.exports = {
  name: 'devicetype.changed',
  collection: 'devicetypes',
  model: deviceTypesModel,
  watchOptions: { fullDocument: 'updateLookup' }
};

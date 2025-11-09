const { deviceModel } = require('../../models/schemas/devices');

module.exports = {
  name: 'device.changed',
  collection: 'devices',
  model: deviceModel,
  watchOptions: { fullDocument: 'updateLookup' }
};

const { colorModel } = require('../../models/schemas/colors');


module.exports = {
   name: 'color.changed',
   collection: 'colors',
   model: colorModel,
   watchOptions: { fullDocument: 'updateLookup'}
};
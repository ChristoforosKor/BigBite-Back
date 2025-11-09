const { collectionPoint } = require('../../models/schemas/collectionPoints');


module.exports = {
   name: 'collectionPoint.changed',
   collection: 'collectionpoints',
   model: collectionPoint,
   watchOptions: { fullDocument: 'updateLookup'}
};
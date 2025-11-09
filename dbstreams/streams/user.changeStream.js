const { User } = require('../../models/schemas/users');


module.exports = {
   name: 'user.changed',
   collection: 'users',
   model: User,
   watchOptions: { fullDocument: 'updateLookup'}
};
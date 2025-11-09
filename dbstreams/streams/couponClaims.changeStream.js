const { couponClaimsModel } = require('../../models/schemas/couponClaims');


module.exports = {
   name: 'couponClaim.changed',
   collection: 'couponClaims',
   model: couponClaimsModel,
   watchOptions: { fullDocument: 'updateLookup'}
};
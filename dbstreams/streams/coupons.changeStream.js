const { couponsModel } = require('../../models/schemas/coupons');


module.exports = {
   name: 'coupon.changed',
   collection: 'coupons',
   model: couponsModel,
   watchOptions: { fullDocument: 'updateLookup'}
};
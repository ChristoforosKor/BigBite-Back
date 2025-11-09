const mongoose = require('mongoose');
const Joi = require('joi');
const CodeError = require("../../lib/errors/CodeError");
const { metaFields, metaRules } = require("./commonfieldsrules");

const COUPON_FIELD_WHITELIST = [
    'discount_percentage',
    'pay_x',
    'get_x',
    'coupon_value',
    'points_value',
    'min_purchase',
    'gift_offer',
    'unit_price'
];

const offerTypesSchema = new mongoose.Schema({
            type: String,
            requiredFields:{
                type: [String],
                default:[],
            },
            fieldLabels: {
                type: Map,
                of: String,
                default: {}
            },
            ...metaFields
},
{
    timestamps:true
});
const offerTypesModel = mongoose.model('OfferTypes', offerTypesSchema);
exports.offerTypesModel = offerTypesModel;

const offerTypesValidationSchema = Joi.object({
    type: Joi.string().required(),
    requiredFields: Joi.array()
        .items(Joi.string().valid(...COUPON_FIELD_WHITELIST))
        .default([]),
    fieldLabels: Joi.object()
        .pattern(Joi.string().valid(...COUPON_FIELD_WHITELIST), Joi.string().trim().max(100))
        .default({}),
}).keys(metaRules);

function offerTypesValidation(points) {
    const { error, value } = offerTypesValidationSchema.validate(points);
    if (error) throw new CodeError(error, 4000);
    return value;
}
exports.offerTypesValidate = offerTypesValidation;
exports.COUPON_FIELD_WHITELIST = COUPON_FIELD_WHITELIST;

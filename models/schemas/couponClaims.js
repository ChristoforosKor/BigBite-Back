const mongoose = require('mongoose');
const Joi = require('joi');
const CodeError = require("../../lib/errors/CodeError");
const { metaFields, metaRules } = require("./commonfieldsrules");
const uniqid = require("uniqid");

const couponClaimSchema = new mongoose.Schema({
    user: {
        _id: { type: mongoose.Schema.Types.ObjectId },
        username: { type: String },
    },
    coupon: {
        _id: { type: mongoose.Schema.Types.ObjectId },
        name: { type: String },
    },
    group_code: {
        type: String,
        default: null,
    },
    coupon_code: {
        type: String,
        default: uniqid.time(),
    },
    qr_code_svg: {
        type: String,
        default: null,
    },
    redeemed: {
        type: Boolean,
        default: false,
    },
    ...metaFields,
}, {
    timestamps: true
});

const couponClaimsModel = mongoose.model('couponClaims', couponClaimSchema);
exports.couponClaimsModel = couponClaimsModel;

const CouponClaimSchema = Joi.object({
    user: Joi.object({
        _id: Joi.string(),
        username: Joi.string(),
    }),
    coupon: Joi.object({
        _id: Joi.string(),
        name: Joi.string(),
    }).required().messages({
        "any.required": "Το κουπόνι είναι υποχρεωτικό.",
    }),
    group_code: Joi.string().allow(null, '').optional().messages({
        "string.base": "Ο κωδικός ομάδας πρέπει να είναι χαρακτήρας.",
        "string.allow": "Ο κωδικός ομάδας μπορεί να είναι κενό.",
    }),
    coupon_code: Joi.string().optional().messages({
        "string.base": "Ο κωδικός κουπονιού πρέπει να είναι χαρακτήρας.",
    }),
    qr_code_svg: Joi.string().optional().messages({
        "string.base": "Ο κωδικός QR πρέπει να είναι χαρακτήρας.",
    }),
    redeemed: Joi.boolean().optional().messages({
        "boolean.base": "Η εκτέλεση κουπονιού πρέπει να δωθεί.",
    }),
    createdAt: Joi.date().optional().messages({
        "date.base": "Η ημερομηνία δημιουργίας πρέπει να είναι έγκυρη.",
    }),
    updatedAt: Joi.date().optional().messages({
        "date.base": "Η ημερομηνία ενημέρωσης πρέπει να είναι έγκυρη.",
    }),
}).keys(metaRules);

const CouponClaimUpdateSchema =  Joi.object({
        redeemed : Joi.boolean()
}).keys(metaRules);


function couponClaimsValidation(data) {
    const { error, value } = CouponClaimSchema.validate(data);
    if (error) throw new CodeError(error, 4000);
    return value;
}

exports.couponClaimsValidation = couponClaimsValidation;


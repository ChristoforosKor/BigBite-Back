const mongoose = require('mongoose');
const Joi = require('joi');
const CodeError = require("../../lib/errors/CodeError");
const { offerTypesModel } = require('./offerTypes');
const {metaFields, metaRules } = require("./commonfieldsrules");


const couponsValidationSchema = Joi.object({
    name: Joi.string().min(5).max(50).required().messages({
        "string.base": "Το όνομα πρέπει να είναι χαρακτήρας.",
        "string.min": "Το όνομα πρέπει να έχει τουλάχιστον 5 χαρακτήρες.",
        "string.max": "Το όνομα πρέπει να έχει το πολύ 50 χαρακτήρες.",
        "any.required": "Το όνομα είναι υποχρεωτικό.",
    }),
    offer_type: Joi.object({
        _id: Joi.string(),
        type: Joi.string(),
    }).required().messages({
        "object.base": "Ο τύπος προσφοράς πρέπει να είναι αντικείμενο.",
        "any.required": "Ο τύπος προσφοράς είναι υποχρεωτικός.",
    }),
    discount_percentage: Joi.number().min(0).max(100).allow(null).messages({
        "number.base": "Το ποσοστό έκπτωσης πρέπει να είναι αριθμός.",
        "number.min": "Το ποσοστό έκπτωσης δεν μπορεί να είναι αρνητικό.",
        "number.max": "Το ποσοστό έκπτωσης δεν μπορεί να ξεπερνά το 100.",
    }),
    gift_offer: Joi.string().max(200).allow(null, '').messages({
        "string.base": "H προσφορά πρέπει να είναι χαρακτήρας.",
        "string.max": "H προσφορά πρέπει να έχει έως 200 χαρακτήρες.",
    }),
    coupon_value: Joi.number().min(0).allow(null).messages({
        "number.base": "H τιμή κουπονιού πρέπει να είναι αριθμός.",
    }),
    points_value: Joi.number().integer().min(0).allow(null).messages({
        "number.base": "Οι πόντοι πρέπει να είναι αριθμός.",
        "number.integer": "Οι πόντοι πρέπει να είναι ακέραιος.",
    }),
    min_purchase: Joi.number().min(0).allow(null).messages({
        "number.base": "Η ελάχιστη χρέωση πρέπει να είναι αριθμός.",
    }),
    pay_x: Joi.number().min(0).allow(null).messages({
        "number.base": "Το πλήρωσε Χ πρέπει να είναι αριθμός.",
    }),
    get_x: Joi.number().min(0).allow(null).messages({
        "number.base": "Το πάρε Χ πρέπει να είναι αριθμός.",
    }),
    unit_price: Joi.number().min(0).allow(null).messages({
        "number.base": "Η τιμή μονάδας πρέπει να είναι αριθμός.",
    }),
    start_date: Joi.date().required().messages({
        "date.base": "Η ημερομηνία έναρξης πρέπει να είναι έγκυρη.",
        "date.required": "Η ημερομηνία έναρξης είναι υποχρεωτική.",
    }),
    end_date: Joi.date().required().messages({
        "date.base": "Η ημερομηνία λήξης πρέπει να είναι έγκυρη.",
        "date.required": "Η ημερομηνία λήξης είναι υποχρεωτική.",
    }),
    partner: Joi.object({
        _id: Joi.string(),
        organizationName: Joi.string().allow(null, ''),
    }).required().messages({
        "object.base": "Ο συνεργάτης πρέπει να είναι αντικείμενο.",
        "any.required": "Ο συνεργάτης είναι υποχρεωτικός.",
    }),
    isActive: Joi.boolean().messages({
        "boolean.base": "Η κατάσταση πρέπει να δωθεί.",
    }),

    details: Joi.string().max(1000).allow(null, '').messages({
        "string.base": "Οι λεπτομέρειες πρέπει να είναι χαρακτήρας.",
        "string.max": "Οι λεπτομέρειες πρέπει να έχουν 1000 ψηφία.",
        "string.allow": "Οι λεπτομέρειες μπορεί να είναι κενό.",
    }),
    terms_conditions: Joi.string().max(1000).allow(null, '').messages({
        "string.base": "Οι όροι και προϋποθέσεις πρέπει να είναι χαρακτήρας.",
        "string.max": "Οι όροι και προϋποθέσεις πρέπει να έχουν 1000 ψηφία.",
        "string.allow": "Οι όροι και προϋποθέσεις μπορεί να είναι κενό.",
    }),
}).keys(metaRules);

function couponsValidation(data) {
    const { error, value } = couponsValidationSchema.validate(data);
    if (error) throw new CodeError(error, 4000);
    return value;
}

exports.couponsValidation = couponsValidation;

const couponsSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        minlength:5,
        maxlength:50,
        default: null,
    },
    offer_type:{
        _id: { type: mongoose.Schema.Types.ObjectId },
        type: {type: String},
    },
    //Έκπτωση needs discount_percentage
    //Πληρώνεις x Παίρνεις x needs pay_x and get_x
    //Δωροεπιταγή needs coupon_value and min_purchase
    //Πόντοι need points_value
    //Άλλο needs gift_offer
    discount_percentage:{
        type: Number,
        default: null,
    },
    gift_offer:{
        type: String,
        maxlength: 200,
        default: "",
    },
    coupon_value:{
        type: Number,
        default: null,
    },
    points_value:{
        type: Number,
        default: null,
    },
    min_purchase:{
        type: Number,
        default: null,
    },
    pay_x:{
        type: Number,
        default: null,
    },
    get_x:{
        type: Number,
        default: null,
    },
    unit_price:{
        type: Number,
        default: null,
    },
    start_date:{
        type: Date,
        required: true,
        default: Date.now,
    },
    end_date:{
        type: Date,
        required: true,
        default: null,
    },
    partner:{
        _id: { type: mongoose.Schema.Types.ObjectId },
        organizationName: { type: String },
    },
    isActive:{
        type: Boolean,
        default: true,
    },
    details:{
        type: String,
        maxlength: 1000,
        default: null,
    },
    terms_conditions:{
        type: String,
        maxlength: 1000,
        default: null,
    },
    ...metaFields,
},{
    timestamps:true
});

const couponsModel = mongoose.model('Coupons', couponsSchema);
exports.couponsModel = couponsModel;
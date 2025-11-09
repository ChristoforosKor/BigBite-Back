const Joi = require("joi");
const config = require("config");
const jwt = require("jsonwebtoken");
const {metaFields, metaRules} = require("./commonfieldsrules");
const CodeError = require("../../lib/errors/CodeError");

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    fullname: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50,
    },
    mobile_phone: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 10,
    },
    street: {
        type: String,
        required: true,
        maxlength: 50,
    },
    zipCode: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50,
    },
        image: {
             type: String
    },
    
    streetNo: {
        type: String,
        required: true
    },
    power_supply_number: {
        type: String,
    },
    birth_year: {
        type: Number,
        required: false
    },
    household_members: {
        type: String,
        required: false
    },

    uniqid: {
        type: String,
        unique: true
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
       gender: {
        type: String,
        default: false
    },
     newsletter: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId},
            text: String
        },
    ],
     discounts: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId},
            image: String,
            name: String
        },
    ],
    qr_codes: [
        {
            type: String
        },
    ],
    roles: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
        }],
    ...metaFields
}, {
    timestamps: true
});

userSchema.methods.generateTempToken = function () {
    return jwt.sign(
            {_id: this._id, roles: this.roles},
            config.get("jwtPrivateKey"),
            {expiresIn: Number(config.get('tempTokenExpiration'))}
    );
};
userSchema.methods.generateRefreshToken = function () {

    return jwt.sign({_id: this._id, roles: this.roles},
            config.get('refreshTokenKey'),
            {expiresIn: Number(config.get('refreshTokenExpiration'))});
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
    const schema = Joi.object({
        username: Joi.string().min(5).max(50).required(),
        password: Joi.string().min(5).max(255).required(),
        roles: Joi.array(),
        fullname: Joi.string()
                .min(5)
                .max(50)
                .required(),

        mobile_phone: Joi.alternatives().try(
            Joi.number().integer().min(1000000000).max(9999999999),
            Joi.string().pattern(/^\d{10}$/)
        ).required(), 

        street: Joi.string()
                .trim()
                .min(1)
                .max(100)
                .required(),

        zipCode: Joi.string()
                .min(5)
                .max(5)
                .required(),

        streetNo: Joi.string()
                .required(),
        isConfirmed: Joi.boolean().default(false),
        gender: Joi.string(),
        birth_year: Joi.number(),
        household_members: Joi.string().allow(null, '').min(0).max(25),
        power_supply_number: Joi.string().allow(null, '').min(0).max(25)
    }).keys(metaRules);

    const {error, value} = schema.validate(user);
    
    if (error) throw new CodeError(error, 40000);
    return value;
}

exports.User = User;
exports.validate = validateUser;

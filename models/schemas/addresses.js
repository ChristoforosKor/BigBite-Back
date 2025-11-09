const mongoose = require('mongoose');
const Joi = require('joi');
const CodeError = require("../../lib/errors/CodeError");
const { metaFields, metaRules } = require("./commonfieldsrules");

const addressSchema = new mongoose.Schema({
            address: String,
            latitude: Number,
            longitude: Number,
            ...metaFields
},
{
    timestamps:true
});
const addressModel = mongoose.model('Address', addressSchema);
exports.addressModel = addressModel;

const addressValidationSchema = Joi.object({
  street: Joi.string().required(),
  number: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
}).keys(metaRules);

function addressValidation(points) {
  const { error, value } = addressValidationSchema.validate(points);
    if (error) throw new CodeError(error, 4000);
    return value;
}
exports.addressValidation = addressValidation;


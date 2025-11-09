const mongoose = require('mongoose');
const Joi = require('joi');
const CodeError = require("../../lib/errors/CodeError");
const { userFields, userRules } = require("./commonfieldsrules");

const discountschema = new mongoose.Schema({
            name: String,
            image: String
},
{
    timestamps:true
});
const discountsModel = mongoose.model('Discount', discountschema);
exports.discountsModel = discountsModel;

const discountsValidationSchema = Joi.object({
  name: Joi.string().required(),
  image: Joi.string()
})

function discountsValidation(points) {
  const { error, value } = discountsValidationSchema.validate(points);
    if (error) throw new CodeError(error, 4000);
    return value;
}
exports.discountsValidation = discountsValidation;


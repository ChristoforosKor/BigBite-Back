const mongoose = require('mongoose');
const Joi = require('joi');
const CodeError = require("../../lib/errors/CodeError");
const { userFields, userRules } = require("./commonfieldsrules");

const newsletterchema = new mongoose.Schema({
            text: String
},
{
    timestamps:true
});
const newsletterModel = mongoose.model('Newsletter', newsletterchema);
exports.newsletterModel = newsletterModel;

const newsletterValidationSchema = Joi.object({
  text: Joi.string().required()
})

function newsletterValidation(points) {
  const { error, value } = newsletterValidationSchema.validate(points);
    if (error) throw new CodeError(error, 4000);
    return value;
}
exports.newsletterValidation = newsletterValidation;


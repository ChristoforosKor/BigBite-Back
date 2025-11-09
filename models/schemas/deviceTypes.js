const mongoose = require('mongoose');
const Joi = require('joi');
const CodeError = require("../../lib/errors/CodeError");
const { metaFields, metaRules } = require("./commonfieldsrules");

const deviceTypesSchema = new mongoose.Schema({
            type: String,
            ...metaFields
},
{
    timestamps:true
});
const deviceTypesModel = mongoose.model('DeviceTypes', deviceTypesSchema);


const deviceTypesValidationSchema = Joi.object({
  type: Joi.string().required(),
}).keys(metaRules);

function deviceTypesValidation(points) {
  const { error, value } = deviceTypesValidationSchema.validate(points);
    if (error) throw new CodeError(error, 4000);
    return value;
}

exports.deviceTypesValidate = deviceTypesValidation;
exports.deviceTypesModel = deviceTypesModel;

const mongoose = require('mongoose');
const Joi = require('joi');
const CodeError = require("../../lib/errors/CodeError");
const { metaFields, metaRules } = require("./commonfieldsrules");

const deviceSchema = new mongoose.Schema({
    deviceId: String,
    battery : Number,
    fill: Number,
    title: String,
    type: {
        _id: { type: mongoose.Schema.Types.ObjectId },
        type: { type: String }
    },
    ...metaFields
},
{
    timestamps:true
});
const deviceModel = mongoose.model('Device', deviceSchema);
exports.deviceModel = deviceModel;

const devicePDAValidationSchema = Joi.object({
  deviceId: Joi.string().required(), 
  title: Joi.string().required(),
   type:  Joi.object({
            _id: Joi.string(),
            type: Joi.string()
    }),
}).keys(metaRules);


const deviceBinValidationSchema = Joi.object({
  deviceId: Joi.string().required(),
  title: Joi.string().required(),
    type:  Joi.object({
            _id: Joi.string(),
            type: Joi.string()
    }),
  battery: Joi.number().optional(),
  fill: Joi.number().optional()
}).keys(metaRules);



function deviceBinValidation(points) {
    const { error, value } = deviceBinValidationSchema.validate(points);
    if (error) throw new CodeError(error, 4000);
    return value;
}
function devicePDAValidation(points) {
    const { error, value } = devicePDAValidationSchema.validate(points);
    if (error) throw new CodeError(error, 4000);
    return value;
}
exports.devicePDAValidation = devicePDAValidation;
exports.deviceBinValidation = deviceBinValidation;


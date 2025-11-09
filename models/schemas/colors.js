const mongoose = require("mongoose");
const Joi = require("joi");
const CodeError = require("../../lib/errors/CodeError");
const {metaFields, metaRules } = require("./commonfieldsrules");

const colorSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: true,
    },
    code_number: {
      type: String
    },
     type:{
         type: String
    },
            ...metaFields
  },
  { timestamps: true },
);

const colorValidation = Joi.object({
  color: Joi.string().required(),
  type: Joi.string(),
  code_number: Joi.string().min(2).max(2).required(),

}).keys(metaRules);

const colorModel = mongoose.model("Color", colorSchema);

function colorValidate(data) {
  const { error, value } = colorValidation.validate(data);
  if (error) throw new CodeError(error, 4000);
  return value;
}

exports.colorModel = colorModel;
exports.colorValidate = colorValidate;

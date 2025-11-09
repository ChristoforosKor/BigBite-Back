const mongoose = require("mongoose");
const Joi = require("joi");
const CodeError = require("../../lib/errors/CodeError");
const {metaFields, metaRules } = require("./commonfieldsrules");

const partnerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
            ...metaFields
  },
  { timestamps: true },
);

const partnerValidation = Joi.object({
  type: Joi.string().required(),
}).keys(metaRules);

const partnerModel = mongoose.model("Partnertype", partnerSchema);

function partnerValidate(data) {
  const { error, value } = partnerValidation.validate(data);
  if (error) throw new CodeError(error, 4000);
  return value;
}

exports.partnerModel = partnerModel;
exports.partnerValidate = partnerValidate;

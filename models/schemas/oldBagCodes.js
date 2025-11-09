const mongoose = require('mongoose');
const Joi = require('joi');
const CodeError = require("../../lib/errors/CodeError");
const {metaFields, metaRules} = require("./commonfieldsrules");


const codeSchema = new mongoose.Schema(
  {
      code: {
          type:String,
          index: true
      },
      color: {
          _id: { type: mongoose.Schema.Types.ObjectId},
          color: { type: String},
          type: { type: String}
      },
      prefix: {
          type: String
     },
      number: {
      type: Number
    },
      user: {
          _id: { type: mongoose.Schema.Types.ObjectId},
          username: { type: String }
    },
            ...metaFields
  },
  { timestamps: true },
);

const codeValidation = Joi.object({
  code: Joi.string(),
    color: Joi.object({
        _id: Joi.string(),
        color: Joi.string(),
         type: Joi.string()
    }),
  user:Joi.object({
      _id: Joi.string(),
      username: Joi.string()
  }),
  number: Joi.number(),
  prefix: Joi.string().required(),
}).keys(metaRules);

const codeModel = mongoose.model("Code", codeSchema);

function codeValidate(data) {
  const { error, value } = codeValidation.validate(data);
  if (error) throw new CodeError(error, 4000);
  return value;
}

exports.codeModel = codeModel;
exports.codeValidate = codeValidate;

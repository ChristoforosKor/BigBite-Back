const mongoose = require("mongoose");
const Joi = require("joi");
const CodeError = require("../../lib/errors/CodeError");
const { metaFields, metaRules } = require("./commonfieldsrules");

const partnerTypeSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, required: true }
}, { _id: false }); 

const schema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true,
  },

  colors: [
      { _id: { type: mongoose.Schema.Types.ObjectId },
        color: { type: String}
      }
  ],

  organizationType : {
       type: String,
  },
   partnerType: partnerTypeSchema,
  organizationCode: {
    type: String,
    minlength: 4,
    maxlength: 4,
  },
  organizationVat:{
    type: String,
    minlength:9,
    maxlength:9,
  },
  organizationTaxOffice:{
    type: String,
  },
  organizationContact:{
    type: String,
  },
  organizationStreet:{
    type: String,
  },
  organizationStreetNo:{
    type: String
  },
  organizationMunicipality:{
    type: String,
  },
  organizationZipCode:{
    type: Number,
  },
  organizationLogo:{
    type: String,
    maxlength: 500
  },
  organizationSiteURL:{
    type: String,
    maxlength:2048,
  },
  organizationStatus:{
    type: Boolean,
    default:true,
  },
  
  ...metaFields,
},
{
      timestamps: true
});

const organizationModel = mongoose.model("Organization", schema);

const organizationValidation = Joi.object({
  organizationName: Joi.string().required(),
  organizationType: Joi.string(),
  organizationCode: Joi.string().min(4).max(4),
  colors: Joi.array().items(Joi.object({
      _id: Joi.string(),
      color: Joi.string()
  })),
  organizationStreet: Joi.string(),
  organizationStreetNo: Joi.string(),
  organizationMunicipality: Joi.string(),
  organizationZipCode: Joi.number().min(10000).max(99999)

}).keys(metaRules);

const organizationPartnerValidation = Joi.object({
  organizationName: Joi.string().required(),
  organizationType: Joi.string(),
  partnerType: Joi.object({
  _id: Joi.string(),
  type: Joi.string()
}),
  organizationVat: Joi.string().length(9),
  organizationTaxOffice: Joi.string(),
  organizationContact: Joi.string().required(),
  organizationStreet: Joi.string().required(),
  organizationStreetNo: Joi.string(),
  organizationMunicipality: Joi.string(),
  organizationZipCode: Joi.number().min(10000).max(99999),
  organizationLogo: Joi.string().max(500),
  organizationSiteURL: Joi.string().max(2048),
  organizationStatus: Joi.boolean().default(true),
}).keys(metaRules);

function organizationPartnerValidate(data) {
  const { error, value } = organizationPartnerValidation.validate(data);
  if (error) throw new CodeError(error, 4000);
  return value;
}


function organizationValidate(data) {
  const { error, value } = organizationValidation.validate(data);
  if (error) throw new CodeError(error, 4000);
  return value;
}

module.exports.organizationModel = organizationModel;
module.exports.organizationValidate = organizationValidate;
module.exports.organizationPartnerValidate = organizationPartnerValidate;
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const userFields = {
    createdBy: {
    _id: { type: Schema.Types.ObjectId},
    username: { type: String }
  },
  updatedBy: {
    _id: { type: Schema.Types.ObjectId},
    username: { type: String}
  },
  coOwners: [
    {
      _id: { type: Schema.Types.ObjectId},
      username: { type: String }
    }
  ],
};

const organizationField = {
  organization: {
    _id: { type: Schema.Types.ObjectId },
    organizationName: { type: String }
  },
};

const userRules = {
      createdBy: Joi.object({
        _id: Joi.string(),
        username: Joi.string()
    }),
    updatedBy: Joi.object({
        _id: Joi.string(),
        username: Joi.string()
    }),
    coOwners: Joi.array().items(
        Joi.object({
          _id: Joi.string(),
          username: Joi.string()
        })
    ),
};

const organizationRule = {
    organization: Joi.object({
        _id: Joi.string(),
        organizationName: Joi.string()
    }),
};


module.exports.userMetaSchema = userFields;
module.exports.organizationField = organizationField;
module.exports.metaFields = { ...userFields, ...organizationField };
module.exports.userFields = userFields;
module.exports.userRules = userRules;
module.exports.organizationRule = organizationRule;
module.exports.metaRules = { ...userRules, ...organizationRule };

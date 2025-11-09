const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const permissionsOptions = require("../../lib/permissionsoptions");
const { metaFields, metaRules } = require("./commonfieldsrules");
const CodeError = require("../../lib/errors/CodeError");


const sessionPermissionsSchema = new mongoose.Schema(
  {
    entity: {
      type: String,
      required: true,
    },

    allowed: [
      {
        type: Number,
        required: true,
        enum: [...Object.values(permissionsOptions)],
      },
    ],
  },
  { _id: false },
);

const sessionDataSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      ref: "User",
    },
    permissions: {
      type: [sessionPermissionsSchema],
      required: true,
    },
  },
  { _id: false },
);

const sessionSchema = new mongoose.Schema(
  {
    refreshToken: {
      type: String,
      required: true,
    },
    tempToken: {
      type: String,
      required: true,
    },

    session: {
      type: sessionDataSchema,
      required: true,
    },

    ip: {
      type: String,
    },

    loginAt: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
    refreshedAt: {
      type: Date,
    },

    refreshExpiresAt: {
      type: Date,
      required: true,
    },
    organizationChildren: [{
     type: mongoose.Schema.Types.ObjectId,
     ref: "Organization"
   }],
    location: {
      type: {
        type: String,
        enum: ["Point", "Polygon"],
      },
      coodrdinates: [Number],
    },

    ...metaFields,
  },
  { timestamps: true },
);

const sessionValidation = Joi.object({
  refreshToken: Joi.string().required(),
  tempToken: Joi.string().required(),
  session: Joi.any().required(),
  ip: Joi.string().required(),
  loginAt: Joi.date().required().required(),
  expiresAt: Joi.date().required().required(),
  refreshedAt: Joi.date().optional(),
  organizationChildren:Joi.array().items( Joi.objectId()).optional(),
  refreshExpiresAt: Joi.date().optional().required(),
}).keys(metaRules);

const tokenValidation = Joi.object({
  token: Joi.string().required(),
});

const sessionModel = mongoose.model("Session", sessionSchema);
module.exports.sessionModel = sessionModel;

module.exports.sessionValidate = (data) => {
  const { error, value } = sessionValidation.validate(data);
  if (error) throw new CodeError(error, 4000);
  return value;
};

module.exports.tokenValidate = (token) => {
  const { error, value } = tokenValidation.validate({ token: token });
  if (error) throw new CodeError(error, 4000);
  return value;
};

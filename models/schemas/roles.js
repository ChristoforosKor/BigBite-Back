const mongoose = require("mongoose");
const permissionsOptions = require("../../lib/permissionsoptions");
const Joi = require("joi");
const CodeError = require("../../lib/errors/CodeError");
const { userFields, userRules } = require("./commonfieldsrules");

Joi.objectId = require("joi-objectid")(Joi);
const permissionSchema = new mongoose.Schema(
  {
    entity: {
      type: String,
      required: true,
    },
    allowed: {
      type: [Number],
      enum: [...Object.values(permissionsOptions)],
    },
    denied: {
      type: [Number],
      enum: [...Object.values(permissionsOptions)],
    },
  },
  { _id: false },
);

const roleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    level: {
      type: Number,
      required: true,
      default: 0
    },
    organization: [ {
    _id: { type: mongoose.Schema.Types.ObjectId },
    organizationName: { type: String }
  }],
    permissions: [permissionSchema],
    ...userFields
  },
  { timestamps: true },
);

const permissionRules = Joi.object({
  entity: Joi.string().required(),
  allowed: Joi.array()
    .items(Joi.number().valid(...Object.values(permissionsOptions)))
    .required(),
  denied: Joi.array()
    .items(Joi.number().valid(...Object.values(permissionsOptions)))
    .optional(),
});

const roleValidation = Joi.object({
  role: Joi.string().required(),
  parent: Joi.objectId().optional(),
  permissions: Joi.array().items(permissionRules),
  organization: Joi.array().items(Joi.object({
        _id: Joi.string().optional(),
        organizationName: Joi.string().optional()
  })).optional()
}).keys(userRules);

roleSchema.pre("find", function (next) {
  this.populate("parent");
  next();
});

roleSchema.pre("findById", function (next) {
  this.populate("parent");
  next();
});

const roleModel = mongoose.model("Role", roleSchema);

function roleValidate(data) {
  if (!data.parent) {
    data.parent = undefined;
  }
  const { error, value } = roleValidation.validate(data);
  if (error) throw new CodeError(error, 4000);
  return value;
}

exports.roleModel = roleModel;
exports.roleValidate = roleValidate;
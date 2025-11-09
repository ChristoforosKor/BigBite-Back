const Joi = require("joi");
const config = require("config");
const mongoose = require("mongoose");
const {metaFields, metaRules} = require("./commonfieldsrules");
const CodeError = require("../../lib/errors/CodeError");




const stagedSchema = Joi.object({
    qr_code: Joi.string().optional(),
    type: Joi.string().optional(),
    clientID: Joi.required(),
    bulkMobileCouponBindingModel: Joi.array()
            .items(
                    Joi.object({
                        bagCode: Joi.string().max(14).required(),
                        weight: Joi.number().min(1).max(50000).required(),
                    }),
                    )
            .required(),
    battery: Joi.number().min(0).max(100),
    fill: Joi.number().min(0),
    location: Joi.object({
        latitude: Joi.number().min(-180).max(360),
        longitude: Joi.number().min(-180).max(360),
    }),
    weightDate: Joi.date(),
    status: Joi.array()
            .items(Joi.object({
                status: Joi.string().required(),
                timestamp: mongoose.Schema.Types.Mixed
            })),
    meta: Joi.object({
        createdBy: Joi.any().optional(),
        updatedBy: Joi.any().optional(),
        createdAt: Joi.date().optional(),
        updatedAt: Joi.date().optional()
    }).optional(),
    done: Joi.boolean().optional()
}).keys(metaRules);



const stagedWeightSchema = new mongoose.Schema(
        {
            type: String,
            clientID: mongoose.Schema.Types.Mixed,
            qr_code: {
                type: String,
            },
            weight: {
                type: Number,
            },
            battery: Number,
            fill: Number,
            location: {type: [
                    {
                        latitude: Number,
                        longitude: Number,
                    },
                ],
                default: undefined,
            },
            status: [
                {
                    status: {type: String, required: true},
                    timestamp: mongoose.Schema.Types.Mixed
                }
            ],
            retries: {
                type: Number,
                default: 0
            },
            meta: {
                createdBy: mongoose.Schema.Types.Mixed,
                updatedBy: mongoose.Schema.Types.Mixed,
                createdAt: Date,
                updatedAt: Date
            },
            done: Boolean,
            ...metaFields
        },
        {
            versionKey: false,
        },
        );

const stagedWeightValidation = Joi.object({
    type: Joi.string(),
    clientID:  Joi.string(),
    qr_code: Joi.string(),
    weight: Joi.number(),
    battery: Joi.number(),
    fill: Joi.number(),
    location: Joi.array().items(
        Joi.object({
        latitude: Joi.number(),
        longitude: Joi.number()
        })
    ),
    status: Joi.array().items(
        Joi.object({
        status: Joi.string().required(),
        timestamp: Joi.any(),
        })
    ),

    retries: Joi.number().default(0),

    meta: Joi.object({
                createdBy: Joi.any(),
                updatedBy: Joi.any(),
                createdAt: Joi.date(),
                updatedAt: Joi.date()
    }).optional(),

    done: Joi.boolean(),
}).keys(metaRules);

const weightValidation = Joi.object({
    qr_code: Joi.string().min(14).max(15).required(),
    weight: Joi.number(),
    color: Joi.object({
            _id: Joi.string(),
            color: Joi.string()
    }),
    device:  Joi.object({
            _id: Joi.string(),
            title: Joi.string(),
            type: Joi.string()
     }),
    collectionPoint:  Joi.object({
                    _id: Joi.string(),
                    title: Joi.string(),
                   addresses:  Joi.object({ 
                              _id: Joi.string(),
                             address: Joi.string()
                    })
          }),
    weightDate: Joi.date()
}).keys(metaRules);

const weightSchema = new mongoose.Schema({
    device: {
          _id: { type: mongoose.Schema.Types.ObjectId },
           title: { type: String},
           type: {type: String} 
    },
      collectionPoint: {
           _id: { type: mongoose.Schema.Types.ObjectId },
           title: { type: String},
           addresses: {
                 _id: { type: mongoose.Schema.Types.ObjectId },
               address: {type: String}
           }
    },
    qr_code: {
        type: String,
    },
    weight: {
        type: Number,
    },
    color: {
      _id: { type: mongoose.Schema.Types.ObjectId},
      color: { type: String},
    },
     weightDate: {
        type: Date,
    },
    ...metaFields,
},
        {
            timestamps: true,
        }
);

const bagCodeSchema = new mongoose.Schema({
    bagCode: String,
    status: String,
});

const bagCodeValidation = Joi.object({
    bagCode: Joi.string().min(14).max(15).required(),
    status: Joi.string().required().default("inactive")
});

const Weight = mongoose.model("weights", weightSchema);
const BagCode = mongoose.model("bagCode", bagCodeSchema);
const StagedWeight = mongoose.model("stagedWeights", stagedWeightSchema);

function validateWeights(weights) {
    const { error, value } = weightValidation.validate(weights);
    if (error) throw new CodeError(error, 4000);
    return value;
}
function validateWeight(weight) {
    return stagedSchema.validate(weight);
}

function validateStagedWeights(weight) {
     const { error, value } = stagedWeightValidation.validate(weight);
  if (error) throw new CodeError(error, 4000);
  return value;
}

function validateBagCode(bagCode) {
    return bagCodeSchema.validate(bagCode);
}

exports.Weight = Weight;
exports.StagedWeight = StagedWeight;
exports.validateBagCode = validateBagCode;
exports.BagCode = BagCode;
exports.validateWeights = validateWeights;
exports.validateStagedWeights = validateStagedWeights;
exports.validateWeight = validateWeight;

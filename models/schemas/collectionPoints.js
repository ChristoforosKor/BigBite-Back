const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require("joi-objectid")(Joi);
const CodeError = require("../../lib/errors/CodeError");
const {metaFields, metaRules} = require("./commonfieldsrules");



const addressSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Address'
    },
    address: {
        type: String,
        required: true
    },
    latitude: Number,
    longitude: Number
});

const deviceSchema = new mongoose.Schema({
   _id : {
       type: mongoose.Schema.Types.ObjectId,
       required: true,
       ref: 'Device'
   },
   title: {
       type: String,
       required: true
   },
   type: {

            _id : {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: 'DeviceTypes'
                },   
                type: {
                        type: String,
                        required: true
            }
   }
});


const collectionPointsSchema = new mongoose.Schema({
    addresses: addressSchema,
    devices: [deviceSchema],  
      
//    addresses: {
//        type: mongoose.Schema.Types.ObjectId,
//        ref: "Address"
//    },
    title: String,
//    devices: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
    ...metaFields
}, {
    timestamps: true
});
const collectionPoint = mongoose.model('CollectionPoint', collectionPointsSchema);



const addressValidation = Joi.object({
   _id: Joi.objectId().required(),
   address: Joi.string().required(),
   latitude: Joi.number().optional().allow(null),
   longitude: Joi.number().optional().allow(null)
});

const deviceValidation = Joi.object({
    _id: Joi.objectId().required(),
    title: Joi.string().required(),
    type:  Joi.object({
            _id: Joi.string(),
            type: Joi.string()
        })
});

const collectionPointValidation = Joi.object({
    addresses: addressValidation.required(),
    devices: Joi.array().items(deviceValidation).required().unique('_id'),
    title: Joi.string()    
}).keys(metaRules);


function collectionPointValidate(data) {
    const {error, value} = collectionPointValidation.validate(data);
    if (error)
        throw new CodeError(error, 40000);
    return value;
}

exports.collectionPointValidate = collectionPointValidate;
exports.collectionPoint = collectionPoint;
exports.addressValidation = addressValidation;
exports.deviceValidation = deviceValidation;
//const config = require('config');
const mongoose = require('mongoose');
const Joi = require('joi');

const recyclebinSchema = new mongoose.Schema({
    locationId: Number,
    locationName: String,
    bins: [String]
});
const newLocationSchema = Joi.object({
    locationName: Joi.string().min(3).max(255).required(),
    binId: Joi.array().items(Joi.string().min(3).max(50)).required()
});
const Recyclebin = mongoose.model('recyclebins', recyclebinSchema);
exports.Recyclebin = Recyclebin;
exports.newLocationSchema = newLocationSchema;
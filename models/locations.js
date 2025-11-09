//const config = require('config');
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: String
});
const Location = mongoose.model('locations', locationSchema);

exports.Location = Location;
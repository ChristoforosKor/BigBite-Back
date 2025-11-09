const mongoose = require('mongoose');

module.exports = function (id) {
     const result = mongoose.isValidObjectId(id);
     
     if (result) {
       return id;
     }
     throw new Error('Not a valid id');
};
const validateId = require('../lib/validateId');
const addressModel = require('../models/addresses');


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};

module.exports.create = async (req,res) => {
    return await addressModel.create(req.body);
};

module.exports.update = async (req, res) => {
    const id = getId(req);
    return addressModel.update(id, req.body);
};
//
//module.exports.findById = async (req, res) => {
//  const id = getId(req);
//  return await addressModel.findById(id);
//};
module.exports.getCoordinates = async (req,res) => {
    return await addressModel.getCoordinates(req.body.address);
};

module.exports.getAddress = async (req,res) => {
    return await addressModel.getAddress(req.body.latitude , req.body.longitude );
};
module.exports.find = async (req, res) => {
    return await addressModel.find(req.filters, null, req.paging, req.ordering, [  { path: 'createdBy', select: 'username' },{ path: 'updatedBy', select: 'username' },'organization']);  
};

module.exports.delete = async (req, res) => {
    const id = getId(req);
    return await addressModel.delete(id);
};


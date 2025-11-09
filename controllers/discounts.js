const validateId = require('../lib/validateId');
const discountsModel= require('../models/discounts');


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};

module.exports.create = async (req) => {
    return await discountsModel.create(req.body);
};

module.exports.update = async (req) => {
    const id = getId(req);
    return discountsModel.update(id, req.body);
};

module.exports.findById = async (req) => {
  const id = getId(req);
  return await discountsModel.findById(id);
};

module.exports.find = async (req) => {
    return await discountsModel.find();
};

module.exports.delete = async (req) => {
    const id = getId(req);
    return await discountsModel.delete(id);
};


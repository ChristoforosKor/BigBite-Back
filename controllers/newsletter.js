const validateId = require('../lib/validateId');
const newsletterModel= require('../models/newsletter');


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};

module.exports.create = async (req) => {
    return await newsletterModel.create(req.body);
};

module.exports.update = async (req) => {
    const id = getId(req);
    return newsletterModel.update(id, req.body);
};

module.exports.findById = async (req) => {
  const id = getId(req);
  return await newsletterModel.findById(id);
};

module.exports.find = async (req) => {
    return await newsletterModel.find();
};

module.exports.delete = async (req) => {
    const id = getId(req);
    return await newsletterModel.delete(id);
};


const validateId = require('../lib/validateId');
const offerTypesModel= require('../models/offerTypes');


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};

module.exports.create = async (req) => {
    return await offerTypesModel.create(req.body);
};

module.exports.update = async (req) => {
    const id = getId(req);
    return offerTypesModel.update(id, req.body);
};

module.exports.findById = async (req) => {
    const id = getId(req);
    return await offerTypesModel.findById(id);
};

module.exports.find = async (req) => {
    return await offerTypesModel.find(req.filters, null, req.paging, req.ordering,  {});
};

module.exports.delete = async (req) => {
    const id = getId(req);
    return await offerTypesModel.delete(id);
};


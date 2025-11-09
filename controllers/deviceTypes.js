const validateId = require('../lib/validateId');
const deviceTypesModel= require('../models/deviceTypes');


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};

module.exports.create = async (req) => {
    return await deviceTypesModel.create(req.body);
};

module.exports.update = async (req) => {
    const id = getId(req);
    return deviceTypesModel.update(id, req.body);
};

module.exports.findById = async (req) => {
  const id = getId(req);
  return await deviceTypesModel.findById(id);
};

module.exports.find = async (req) => {
    return await deviceTypesModel.find(req.flt.mongo, null, req.paging, req.ordering, { });
};

module.exports.delete = async (req) => {
    const id = getId(req);
    return await deviceTypesModel.delete(id);
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await deviceTypesModel.exportToExcel(filters, ordering);
    return result;
};
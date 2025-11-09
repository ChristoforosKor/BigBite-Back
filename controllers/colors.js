const validateId = require('../lib/validateId');
const colorModel= require('../models/colors');


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};

module.exports.create = async (req) => {
    return await colorModel.create(req.body);
};

module.exports.update = async (req) => {
    const id = getId(req);
    return colorModel.update(id, req.body);
};

module.exports.findById = async (req) => {
  const id = getId(req);
  return await colorModel.findById(id);
};

module.exports.find = async (req) => {
    return await colorModel.find(req.flt.mongo, null, req.paging, req.ordering, { });
};

module.exports.delete = async (req) => {
    const id = getId(req);
    return await colorModel.delete(id);
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await colorModel.exportToExcel(filters, ordering);
    return result;
};


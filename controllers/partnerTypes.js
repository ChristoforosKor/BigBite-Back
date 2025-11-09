const validateId = require('../lib/validateId');
const partnerModel = require('../models/partnerTypes');


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};

module.exports.create = async (req,res) => {
    return await partnerModel.create(req.body);
};

module.exports.update = async (req, res) => {
    const id = getId(req);
    return partnerModel.update(id, req.body);
};

module.exports.findById = async (req, res) => {
  const id = getId(req);
  return await partnerModel.findById(id);
};

module.exports.find = async (req, res) => {
    return await partnerModel.find(req.flt.mongo, null, req.paging, req.ordering, { });
};

module.exports.delete = async (req, res) => {
    const id = getId(req);
    return await partnerModel.delete(id);
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await partnerModel.exportToExcel(filters, ordering);
    return result;
};

const validateId = require('../lib/validateId');
const deviceModel= require('../models/devices');


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};

const embedded = {
        type: { ref: "DeviceTypes", as: "type",  fields:["type"]},
};

module.exports.create = async (req) => {
    return await deviceModel.create(req.body ,embedded );
};

module.exports.update = async (req) => {
    const id = getId(req);
    return deviceModel.update(id, req.body, embedded);
};

module.exports.findById = async (req) => {
  const id = getId(req);
  return await deviceModel.findById(id);
};

module.exports.find = async (req, res) => {
    return await deviceModel.find(req.flt.mongo,null , req.paging, req.ordering, { } );
};


module.exports.delete = async (req) => {
    const id = getId(req);
    return await deviceModel.delete(id);
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await deviceModel.exportToExcel(filters, ordering);
    return result;
};
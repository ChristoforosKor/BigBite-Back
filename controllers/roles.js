const validateId = require('../lib/validateId');
const roleModel = require('../models/roles');


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};

module.exports.create = async (req,res) => {
    return await roleModel.create(req.body);
};

module.exports.update = async (req, res) => {
    const id = getId(req);
    return roleModel.update(id, req.body);
};

module.exports.findById = async (req, res) => {
  const id = getId(req);
  return await roleModel.findById(id);
};

module.exports.find = async (req, res) => {
    return await roleModel.find(req.flt.mongo, null, req.paging, req.ordering,  {
        organization: { ref: "Organization", as: "organization",  fields: ['organizationName']},
        createdBy: { ref: "User", as: "createdBy", fields: ['username'] },
        updatedBy: {ref: "User", as: "updatedBy",  fields: ['username']},
    });
};
module.exports.delete = async (req, res) => {
    const id = getId(req);
    return await roleModel.delete(id);
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await roleModel.exportToExcel(filters, ordering);
    return result;
};

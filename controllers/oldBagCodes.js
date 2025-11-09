const validateId = require('../lib/validateId');
const codeModel= require('../models/oldBagCodes');


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid Id');
    }
    return id;
};

const embedded = {
    color: { ref:"Color", as: "color", fields: ["color"] },
    organization: { ref: "Organization", as: "organization",  fields: ['organizationName']},
    user: { ref: "User", as: "user",  fields: ['username'] },
};

module.exports.createMany = async (req) => {
    return await codeModel.createMany(req.body, embedded);
};

module.exports.update = async (req) => {
    const id = getId(req);
    return codeModel.update(id, req.body, embedded);
};

module.exports.addUser = async (req) => {
    return codeModel.addUser(req.body);
};
module.exports.findById = async (req) => {
  const id = getId(req);
  return await codeModel.findById(id);
};

module.exports.find = async (req) => {
    return await codeModel.find(req.flt.mongo, null, req.paging, req.ordering,  { });
};

module.exports.delete = async (req) => {
    const id = getId(req);
    return await codeModel.delete(id);
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await codeModel.exportToExcel(filters, ordering);
    return result;
};

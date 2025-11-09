const userModel = require('../models/users');
const jwt = require('jsonwebtoken');
const config = require('config');

const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};

const embedded = {
    discounts: { ref:"Discount", as: "discounts", fields: ["name", "image"] },
    newsletter: { ref: "Newsletter", as: "newsletter",  fields: ['text']},
};

module.exports.findById = async (req, res) => {
 const id = getId(req);
 return await userModel.findById(id,req.project,req.populate);
};

module.exports.find = async (req) => {
    return await userModel.find(req.flt.mongo, null, req.paging, req.ordering, { roles: {ref: "Role", as: "roles", fields: ["role"]},})
};

module.exports.findMe = async (req) => {
 return await userModel.findMe();  
};

module.exports.create = async (req, res) => {
    return await userModel.create(req.body);
};

module.exports.register = async (req, res) => {
    return await userModel.register(req.body);
};

module.exports.update = async (req, res) => {
    const id = getId(req);
    return userModel.update(id, req.body, embedded);
};
module.exports.password = async (req, res) => {
     const { email } = jwt.verify(req.query.token, config.get("secret"));
    return userModel.password(email, req.body);
};

module.exports.requestPassword = async (req, res) => {
    return userModel.requestPassword(req.body);
};
module.exports.delete = async (req, res) => {
    const id = getId(req);
    return await userModel.delete(id);
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await userModel.exportToExcel(filters, ordering);
    return result;
};
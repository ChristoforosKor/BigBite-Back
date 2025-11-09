const couponsModel = require("../models/coupons");
const getId = (req, strict = true) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error("Not a valid");
    }
        return id;
};
const embedded = {
        offer_type: { ref: "OfferTypes", as: "offer_type",  fields:["type"]},
        partner : { ref: "Organization", as: "partner", fields: ["organizationName"] }
};

module.exports.create = async (req, res) => {
    return await couponsModel.create(req.body, embedded);
};

module.exports.update = async (req, res) => {
    const id = getId(req);
    return await couponsModel.update(id, req.body, embedded);
};

module.exports.delete = async (req, res) => {
    const id = getId(req);
    return await couponsModel.delete(id);
};

module.exports.findById = async (req, res) => {
    const id = getId(req);
    return await couponsModel.findById(id);
};

module.exports.find = async (req, res) => {
    return await couponsModel.find(req.flt.mongo,null , req.paging, req.ordering, {});
};

module.exports.mobileFind = async (req, res) => {
    return await couponsModel.mobileFind(req.flt.mongo,null , req.paging, req.ordering, { 
        partner : { 
            ref: "Organization", 
            as: "partner", 
            fields: [
                "organizationName",  
                "organizationType", 
                "organizationLogo", 
                "organizationSiteURL", 
                "partnerType",
                "organizationContact",
                "organizationMunicipality"
            ] 
        }
    });
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await couponsModel.exportToExcel(filters, ordering);
    return result;
};
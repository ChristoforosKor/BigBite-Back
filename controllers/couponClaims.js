const couponClaimsModel = require("../models/couponClaims");
const getId = (req, strict = true) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error("Not a valid");
    }
        return id;
};

const embedded = {
        user: { ref: "User", as: "user",  fields:["username"]},
        coupon: { ref: "Coupons", as: "coupon", fields: ['name'] },
};

module.exports.create = async (req, res) => {
    return await couponClaimsModel.create(req.body, embedded);
};

module.exports.produce = async (req, res) => {
    const id = getId(req);
    return await couponClaimsModel.produce(id, req.body, embedded);
};

module.exports.update = async (req, res) => {
    const id = getId(req);
    return await couponClaimsModel.update(id, req.body, embedded);
};

module.exports.redeem = async (req, res) => {
    const id = getId(req);
    return await couponClaimsModel.redeem(id, req.body, embedded);
};

module.exports.delete = async (req, res) => {
    const id = getId(req);
    return await couponClaimsModel.delete(id);
};

module.exports.findById = async (req, res) => {
    const id = getId(req);
    return await couponClaimsModel.findById(id);
};

module.exports.find = async (req, res) => {
    return await couponClaimsModel.find(req.flt.mongo, null, req.paging, req.ordering, {});
};

module.exports.mobileFind = async (req, res) => {
    return await couponClaimsModel.mobileFind(req.flt.mongo,null,req.paging,req.ordering,
    {
        coupon: {
        ref: "Coupons",
        as: "coupon",
         populate: [
            {
            field: "partner",
            ref: "Organization",
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
        ]
        }
    }
    );
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await couponClaimsModel.exportToExcel(filters, ordering);
    return result;
};
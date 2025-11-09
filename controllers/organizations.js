const validateId = require('../lib/validateId');
const organizationModel = require('../models/organizations');
const userModel = require('../models/users');


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};
const embeddedPartner =  {
            partnerType: { ref: "Partnertype", as: "partnerType",  fields: ['type']},
}
module.exports.createPartner = async (req) => {
  // 1. Prepare partner (organization) data from request
    const partnerData = {...req.body};

    // Remove user-specific fields before creating the organization
    delete partnerData.username;
    delete partnerData.password;
    delete partnerData.roles;
    delete partnerData.mobile_phone;
    let organization;
    try {
        // 2. Create the organization (partner)
        organization = await organizationModel.createPartner(partnerData);
        // 3. Prepare user data
        const userData = {
            username: req.body.username,
            password: req.body.password,
            roles: req.body.roles,
            fullname: req.body.organizationContact,
            mobile_phone: req.body.mobile_phone,
            //municipality: req.body.organizationMunicipality,
            street: req.body.organizationStreet,
            zipCode: String(req.body.organizationZipCode),
            streetNo: req.body.organizationStreetNo,
            organization: String(organization._id),
        };
        // 4. Create the user
        //console.log('userData:', userData);
        const user = await userModel.create(userData);
        await user.save();
        const updatedData ={
            ...partnerData,
            createdBy: { _id: user._id.toString(), username: user.username},
            updatedBy: { _id: user._id.toString(), username: user.username}
        }
        //Update organization with createdBy and updatedBy
//        organization = await organizationModel.findByIdAndUpdate(organization._id, updatedData);

        // 5. return both records
        return { organization,user };
    } catch (error) {
        if (organization && organization._id) {
            await organizationModel.findByIdAndDelete(organization._id);
        }
        throw error;
    }
};
module.exports.updatePartner = async (req) => {
    const id = getId(req);
    return await organizationModel.updatePartner(id, req.body, embeddedPartner);
};
module.exports.findByIdPartner = async (req) => {
    const id = getId(req);
    return await organizationModel.findByIdPartner(id);
};
module.exports.findPartner = async (req) => {
    /*const sessionData = getSessionData();
    const user = sessionData;
    const filters = {
        ...req.filters,
        organization: user.organization,
    };
    console.log('filters:', filters);*/
    return await organizationModel.findPartner(req.flt.mongo,
        null,
        req.paging,
        req.ordering,
        {}
        );
};

module.exports.deletePartner = async (req) => {
    const id = getId(req);
    return await organizationModel.deletePartner(id);
};
const embeddedOrg = { colors: { ref: "Color", as: "colors",  fields: ['color']} }

module.exports.create = async (req) => {
    return await organizationModel.create(req.body,embeddedOrg);
};

module.exports.update = async (req) => {
    const id = getId(req);
    return organizationModel.update(id, req.body,embeddedOrg );
};

module.exports.findById = async (req) => {
  const id = getId(req);
  return await organizationModel.findById(id);
};

module.exports.find = async (req) => {
    return await organizationModel.find(req.flt.mongo,
        null,
        req.paging,
        req.ordering,
        { });
};

module.exports.getAllOrg = async (req) => {
    return await organizationModel.getAllOrg();
};

module.exports.delete = async (req) => {
    const id = getId(req);
    return await organizationModel.delete(id);
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await organizationModel.exportToExcel(filters, ordering);
    return result;
};

module.exports.partnerExport = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await organizationModel.exportPartnersToExcel(filters, ordering);
    return result;
};
const validateId = require('../lib/validateId');
const collectionPoint = require('../models/collectionPoints');


 const embedded = {
        devices: { ref: "Device", as: "devices",  fields:["title", "type"]},
//        addresses: { ref: "Address", as: "address", fields: ['address', 'latitude', 'longitude'] } // address ia populated because of the address mechanism
    };


const getId = (req, strict = true ) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};

module.exports.create = async (req,res) => {
    return await collectionPoint.create(req.body,embedded);
};
module.exports.findFull = async () => {
    return await collectionPoint.findFull();
};
module.exports.findLocation = async () => {
    return await collectionPoint.findLocation();
};


module.exports.update = async (req, res) => {
    const id = getId(req);
    return collectionPoint.update(id, req.body, embedded);
};

module.exports.findById = async (req, res) => {
  const id = getId(req);
  return await collectionPoint.findById(id);
};

module.exports.find = async (req, res) => {
    return await collectionPoint.find(req.flt.mongo, null, req.paging, req.ordering, { });
};

module.exports.delete = async (req, res) => {
    const id = getId(req);
    return await collectionPoint.delete(id);
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await collectionPoint.exportToExcel(filters, ordering);
    return result;
};
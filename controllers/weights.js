const weightModel = require('../models/weights');


const getId = (req, strict = true) => {
    const id = req.params.id;
    if (!id && strict) {
        throw new Error('Not a valid');
    }
    return id;
};
 const embedded = {
        device: { ref: "Device", as: "device",  fields:["title", "type"]},
        color: { ref: "Color", as: "color", fields: ['color'] },
        collectionPoint :{ ref:"CollectionPoint" , as: 'collectionPoint' , fields: ["title"], populate: 
                { field: 'addresses', fields: ['address', '_id'] }
             }
    };

module.exports.batchCreate = async  (req,res)  =>{
   const body = req.body;
   return await weightModel.batchCreate(body);
}
module.exports.CreatePdaPeiraias = async  (req,res)  =>{
   const body = req.body;
   return await weightModel.CreatePdaPeiraias(body);
}
module.exports.CreatePdaVvv = async  (req,res)  =>{
   const body = req.body;
   return await weightModel.CreatePdaVvv(body);
}

module.exports.create = async  (req,res)  =>{
   const body = req.body;
   return await weightModel.create(body, embedded);
}


module.exports.update = async  (req,res)  =>{
    const id = getId(req);
    const data = req.body;
    return await weightModel.update(id, data, embedded);
}

module.exports.find = async (req, res) => {
    return await weightModel.find(req.flt.mongo,null , req.paging, req.ordering,{});
};
module.exports.delete =async (req, res) => {
    const id = getId(req);
    return await weightModel.delete(id);
};

module.exports.export = async (req, res) => {
    const filters = req.flt.mongo || {};
    const ordering = req.ordering || {};

    const result = await weightModel.exportToExcel(filters, ordering);
    return result;
};
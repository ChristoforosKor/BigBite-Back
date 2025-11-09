const ENTITY = require("./entities").OFFER_TYPES;
const {
    prepareCreate,
    prepareUpdate,
    prepareRetrieve,
    prepareDelete,
} = require("../lib/sessionstorage");
const { listResults } = require("../lib/results");
const validateId = require("../lib/validateId");
const getCoOwners = require("../lib/getCoOwners");
const {offerTypesModel , offerTypesValidate}= require("./schemas/offerTypes");


module.exports.create = async (data) => {
    try {
    const type = data.type;
    const result =  prepareCreate(ENTITY, data);
    let prev = await offerTypesModel.findOne({type: type})
    if (prev ){
        const error = new Error("Ο τύπος προσφοράς υπάρχει ήδη")
        error.code = 4000;
        throw error;
    }
    offerTypesValidate(result.data);
    return await offerTypesModel.create(result.data);
    } catch (error) {
        throw   error;
    }
};

module.exports.update = async (id, data) => {
    try {
    validateId(id);
    const prev = await offerTypesModel.findOne({_id:id})
    if(prev.type !== data.type){
        let c_code = await offerTypesModel.findOne({type:  data.type});
            if (c_code ){
        const error = new Error("Ο τύπος προσφοράς υπάρχει ήδη")
        error.code = 4000;
        throw error;
    }
    }
//     data.coOwners = await getCoOwners(id, deviceTypesModel);
    const result = prepareUpdate(ENTITY, data);
    offerTypesValidate(result.data);
    const filters = {...result.filters, _id: id};
    const final =  await offerTypesModel.findOneAndUpdate(filters, {$set : result.data})
            if (!final) {
            const err = new Error("Δεν έχετε άδεια να αλλάξετε αυτόν τον τύπο προσφοράς.");
            err.code = 4000;
            throw err;
            }
            return  result;
    return final;
    } catch (error) {
        throw  error;
    }
};

//module.exports.findById = async (id) => {;
//  validateId(id);
// // prepareRetrieve(ENTITY);
//  return await roleModel.findById(id).populate("parent", "_id, role");
//};

module.exports.find = async (filters, projection, ordering,paging ,populate) => {
    try {
    return await listResults(offerTypesModel, ENTITY, filters,  projection, ordering, populate,paging);

    } catch (error) {
        throw error;
    }
};

module.exports.delete = async (id) => {
    try {
        validateId(id);
    const data = prepareDelete(ENTITY);
    const filters = {...data.filters, _id: id};
    const result =  await offerTypesModel.findOneAndDelete(filters);
        if (!result) {
            const err = new Error("Δεν έχετε άδεια να διαγράψετε αυτόν τον τύπο προσφοράς.");
            err.code = 4000;
            throw err;
            }
            return  result;
    } catch (error) {
        throw error;
    }
};

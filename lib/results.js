const {
    prepareCreate,
    prepareUpdate,
    prepareRetrieve,
    prepareDelete,
} = require("../lib/sessionstorage");
const {collectionPoint} = require("../models/schemas/collectionPoints");
const {codeModel} = require("../models/schemas/oldBagCodes");
const {User} = require("../models/schemas/users");
const makeFilterNormalizer = require('../factories/makeFilterNormalizer');
const makeMongoFilterFromTokens = require('../factories/makeMongoFilterFromTokens');
const isEmptyObject = require('../utils/isEmptyObject');
const {mergeMongoFiltersAND} = require('../utils/mergeMongoFilters');
const {getSessionData} = require('./sessionstorage');
const { findWithFilters } = require('../utils/findWithFilters');


async function getFilter(entity, runTimeFilters,paging, skipRetrieve = false) {
    const retrieve = skipRetrieve ? {} : prepareRetrieve(entity); //Filters enforced by permissions and organization.
    const retrieveFilter = retrieve.filters;
    let  combinedFilters = [];
    
    if (!isEmptyObject(runTimeFilters))
        combinedFilters.push(runTimeFilters);
    if (!isEmptyObject(retrieveFilter))
        combinedFilters.push(retrieveFilter);
    if (entity === 'weights' && retrieve.own) {
        const session = getSessionData();
        const userId = session.session.user._id.toString();
        const user = await User.findById(userId);
        const codes = await codeModel.find({user: user._id}).select('code');
        const codeList = codes.map(c => c.code);
//            combinedFilters = {
//                        ...filters,
//                       qr_code: { $in: [...user.qr_codes, ...codeList] }
//          };

        combinedFilters.push({qr_code: {$in: [...user.qr_codes, ...codeList]}});
    }
    const mongoFilter = combinedFilters.length > 0 ? mergeMongoFiltersAND(combinedFilters): {};
    return mongoFilter;
}


module.exports.listResults = async (
        model,
        entity,
        runTimeFilters,
        projection,
        paging,
        ordering,
        config,
        skipRetrieve = false
        ) => {
  
//    const retrieve = skipRetrieve ? {} : prepareRetrieve(entity); //Filters enforced by permissions and organization.
//    const retrieveFilter = retrieve.filters;
//    
//    let  combinedFilters = [];
//    if (!isEmptyObject(runTimeFilters))
//        combinedFilters.push(runTimeFilters);
//    
//    if (!isEmptyObject(retrieveFilter))
//        combinedFilters.push(retrieveFilter);
//    if (entity === 'weights' && retrieve.own) {
//        const session = getSessionData();
//        const userId = session.session.user._id.toString();
//        const user = await User.findById(userId);
//        const codes = await codeModel.find({user: user._id}).select('code');
//        const codeList = codes.map(c => c.code);
////            combinedFilters = {
////                        ...filters,
////                       qr_code: { $in: [...user.qr_codes, ...codeList] }
////          };
//
//        combinedFilters.push({qr_code: {$in: [...user.qr_codes, ...codeList]}});
//    }
//
//    const mongoFilter = combinedFilters.length > 0 ? mergeMongoFiltersAND(combinedFilters): {};
    const mongoFilter = await getFilter(entity, runTimeFilters,paging, skipRetrieve);
    const options = {...paging, ...ordering, ...projection};
//    options.limit = 2;
//    console.log(JSON.stringify(options, null, 2));
    const res = await findWithFilters(model, mongoFilter, options, config);
    return res;


//    console.log(res.length);
//    console.log(JSON.stringify(res, null, 2));
//    console.log('-------------------------------------');
    
//    const filtering = {...paging, ...ordering};
////    console.log(filtering);
////    console.log(`${JSON.stringify(projection, null, 2), JSON.stringify(populate, null, 2)}`);
//    const resultPromise = model.find(mongoFilter, projection, filtering).populate(populate);
//    const countPromise = model.find(mongoFilter, projection).countDocuments();
//    const results = await Promise.all([resultPromise, countPromise]);
//    if (entity === "weights") {
//        for (let result of results[0]) {
//            if (result.device) {
//                const CollectionPoint = await collectionPoint.findOne({
//                    devices: result.device._ids
//                }).populate('addresses');
//                result.collectionPoint = CollectionPoint;
//            }
//        }
//    }
//
//    return {results: results[0], count: results[1]};
};



module.exports.listResults_ = async (
        model,
        entity,
        runTimeFilters,
        projection,
        paging,
        populate,
        ordering,
        skipRetrieve = false
        ) => {
  
    const retrieve = skipRetrieve ? {} : prepareRetrieve(entity); //Filters enforced by permissions and organization.
    const retrieveFilter = retrieve.filters;
  
    let  combinedFilters = [];
    if (!isEmptyObject(runTimeFilters))
        combinedFilters.push(runTimeFilters);
    
    if (!isEmptyObject(retrieveFilter))
        combinedFilters.push(retrieveFilter);
    if (entity === 'weights' && retrieve.own) {
        const session = getSessionData();
        const userId = session.session.user._id.toString();
        const user = await User.findById(userId);
        const codes = await codeModel.find({user: user._id}).select('code');
        const codeList = codes.map(c => c.code);
//            combinedFilters = {
//                        ...filters,
//                       qr_code: { $in: [...user.qr_codes, ...codeList] }
//          };

        combinedFilters.push({qr_code: {$in: [...user.qr_codes, ...codeList]}});
    }

    const mongoFilter = combinedFilters.length > 0 ? mergeMongoFiltersAND(combinedFilters): {};
    const filtering = {...paging, ...ordering};
//    console.log(`${JSON.stringify(filtering, null, 2), JSON.stringify(populate, null, 2)}`);
    const resultPromise = model.find(mongoFilter, projection, filtering).populate(populate);
    const countPromise = model.find(mongoFilter, projection).countDocuments();
    const results = await Promise.all([resultPromise, countPromise]);
    if (entity === "weights") {
        for (let result of results[0]) {
            if (result.device) {
                const CollectionPoint = await collectionPoint.findOne({
                    devices: result.device._ids
                }).populate('addresses');
                result.collectionPoint = CollectionPoint;
            }
        }
    }
    
    return {results: results[0], count: results[1]};
};
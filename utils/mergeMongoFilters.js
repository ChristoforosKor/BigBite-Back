const isEmptyObject = require('./isEmptyObject');

const mergeMongoFiltersAND = (filters) => {
    return {$and: filters};
//    if (filters.length > 1) return {$and: filters};
//    
//    return filters;
};

module.exports.mergeMongoFiltersAND = mergeMongoFiltersAND;
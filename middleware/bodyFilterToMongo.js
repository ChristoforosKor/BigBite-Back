const DevexFilterToMongoose = require("../dto/DevexFilterToMongoose");
const normalizeQueryFilter = require("../utils/normalizeQueryFilter");

/**
 * Middleware for translating DevExtreme-style POST body filters
 * into Mongo filters (req.flt.mongo).
 */
module.exports = function bodyFilterToMongo(req, _res, next) {
    const rawFilter = req.body?.filter;

    if (!rawFilter) {
      req.flt = req.flt || {};
      req.flt.mongo = {};
      return next();
    }

    const normalized = normalizeQueryFilter(rawFilter);
    if (!normalized) {
      req.flt = req.flt || {};
      req.flt.mongo = {};
      return next();
    }

    const builder = new DevexFilterToMongoose();
    const mongoFilter = builder.transform(normalized);

    req.flt = req.flt || {};
    req.flt.mongo = mongoFilter;

    next();
};

const normalizeQueryFilter = require('../utils/normalizeQueryFilter');

/**
 * Middleware factory.
 * - sourceKey: the key in req.query to read (default: 'filter')
 * - attachTo: where to attach the parsed array on req (default: 'filters')
 * - subKey: optional nested key under req[attachTo] (default: 'raw')
 *
 * Example result: req.filters.raw = [ ["field","contains","value"], "and", ["..."] ]
 */
const  makeFilterNormalizer = ({ sourceKey = 'filter', attachTo = 'runtimeFilters', subKey = 'raw' } = {}) => {
  
 return function filterNormalizerMiddleware(req, _res, next) {
    try {
      const raw = req.query?.[sourceKey];
      const normalized = normalizeQueryFilter(raw);
       if (!req[attachTo]) req[attachTo] = {};
      req[attachTo][subKey] = normalized; // may be null if not present

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = makeFilterNormalizer;
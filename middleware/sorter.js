const config = require("config");
const order = require("../lib/order");
const transform = require('../dto/DevexSortingToMongoose');

module.exports = async (req, res, next) => {
    const sort = transform(req.query.sort);
    if (Object.keys(sort).length > 0) {
      req.ordering = { sort };
    }

    next();
};

const config = require("config");

module.exports.options = (orderOptions) => {
  if (orderOptions == null) return false;
  if (Object.keys(orderOptions).length < 1) return false;
  let ordering = {};

  for (let item in orderOptions) {
    ordering[item] = orderOptions[item] === "desc" ? -1 : 1;
  }

  return ordering;
};

const config = require("config");

module.exports.options = (pagingOptions) => {
    if (Object.keys(pagingOptions).length === 0) {
        return {};
    }
  const pageSize = parseInt(pagingOptions.pageSize)
    ? pagingOptions.pageSize
    : config.get("pageSize");
  let start;
  if (!pagingOptions.pageNumber || parseInt(pagingOptions.pageNumber) === 0) {
    start = 1;
  } else {
    start = parseInt(pagingOptions.pageNumber) + 1;
  }
  return { skip: (parseInt(start) - 1) * pageSize, limit: parseInt(pageSize) };
};

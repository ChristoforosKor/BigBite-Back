/**
 * Tranforms sorting paramters from a Devextreme data table request to 
 * mongoose aware params.
 */

const transform = (sortQuery) => {
  if (!sortQuery) return {};

  let sort = {};

  // Ensure we always have an array
  const items = Array.isArray(sortQuery) ? sortQuery : [sortQuery];

  for (const item of items) {
    if (!item.selector) continue;

    // desc may be string "true"/"false" or boolean
    const isDesc =
      item.desc === true ||
      item.desc === "true" ||
      item.desc === 1 ||
      item.desc === "1";

    sort[item.selector] = isDesc ? -1 : 1;
  }

  return sort;
};

module.exports = transform;

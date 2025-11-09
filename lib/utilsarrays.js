module.exports.diffPrim = (array1, array2) => {
  return array1.filter((item1) => !array2.includes(item1));
};

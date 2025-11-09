const config = require('config');
//const pager = require('../lib/pager');

module.exports = async (req, res, next) => {

    const f = req.query.f;
    let filters = {};
    if (f) {
        Object.keys(f).forEach(key => {
            if (f[key].value) {
                const operation = getOperation(f[key].oper, f[key].value);
                filters[key] = operation;
            }
        });
    }

    req.filters = filters;

    next();

};
function diacriticSensitiveRegex(string = '') {
  return string
    .replace(/α/g, '[αά]')
    .replace(/ε/g, '[εέ]')
    .replace(/η/g, '[ηή]')
    .replace(/ι/g, '[ιίϊΐ]')
    .replace(/ο/g, '[οό]')
    .replace(/υ/g, '[υύϋΰ]')
    .replace(/ω/g, '[ωώ]')
    .replace(/Α/g, '[ΑΆ]')
    .replace(/Ε/g, '[ΕΈ]')
    .replace(/Η/g, '[ΗΉ]')
    .replace(/Ι/g, '[ΙΊΪ]')
    .replace(/Ο/g, '[ΟΌ]')
    .replace(/Υ/g, '[ΥΎΫ]')
    .replace(/Ω/g, '[ΩΏ]');
}




const getOperation = (operand, value) => {

    if (operand === 'eq')
        return value;
    if (operand === 'ne')  
        return {$ne: value};
    if (operand === 'cont'){
        let pattern = diacriticSensitiveRegex(value);
        return  {$regex: pattern, $options:"i"};
    }
    if (operand === 'lt')
        return {$lt: value};
    if (operand === 'gt')
        return {$gt: value};
};

module.exports = (v) => {
    return v !== null && typeof (v) === 'object' && !Array.isArray(v);
};
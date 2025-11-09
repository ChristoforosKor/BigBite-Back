
/**
 * Recursively convert any "object with numeric keys" shape into an Array,
 * keeping the numeric key order stable. Non-numeric keyed objects are kept as-is.
 */

const numericObjectToArray = (node) => {
    if (node == null) return node;
    if (Array.isArray(node)) return mode.map(numericObjectToArray); // recursion so we can catch nested objects.
    
    if (typeof node === 'object') {
        const keys = Object.keys(node);
        
        // If all keys are numeric
        const allNumeric = keys.length > 0 && keys.every(k => String(+k) === k);
        if (allNumeric) {
            return keys
                    .sort((a, b)=> Number(a) - Number(b))
                    .map(k => numericObjectToArray(node[k]));
        }
        
        // otherwise recurse object
        const out = {};
        for (const k of keys) out[k] = numericObjectToArray(node[k]);
        return out;
    }
    
    return node; 
};

module.exports = numericObjectToArray;
const numericObjectToArray = require('./numericObjectToArray');
/**
 * Normalize a "filter" coming from req.query into an Array form.
 * Accepts:
 *  - already-an-array
 *  - qs-parsed nested objects like { '0': { '0': 'field', '1': 'op', '2': 'value' }, '1': 'and', ... }
 *  - JSON stringified array/object
 * Returns an Array or null if not available/parsable.
 */
module.exports = function normalizeQueryFilter(rawFilter) {
    if (rawFilter == null)
        return null;
    // Already an array? Check if it is a valid filter structure
    if (Array.isArray(rawFilter)) {
        if (isSimpleFilterTerm(rawFilter)) {
            return [rawFilter]; // Wrap single filter in an array
        }
        // if it's already a complex structure, return as-is
        return rawFilter;
    }

    // JSON-encoded string? Try to parse.
    if (typeof rawFilter === 'string') {
        const trimmed = rawFilter.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed);
                return normalizeQueryFilter(parsed);
            } catch {
                // fall through - not valid JSON
            }
        }

        // For simple strings, check if they're conjunctions
        const lower = trimmed.toLowerCase();
        if (lower === 'and' || lower === 'or') {
            return lower; // Return conjunction as string
        }

        // Other strings are not valid standalone filters
        return null;
    }

    // qs nested object
    if (typeof rawFilter === 'object') {
        const asArray = numericObjectToArray(rawFilter);
        // If it turned into an array, great; if it stayed an object, it means keys weren’t numeric
        return Array.isArray(asArray) ? asArray : null;
    }

    return null;
};


/**
 * Check if an array represents a simple filter term [field, operator, value]
 */
const isSimpleFilterTerm = (arr) => {
    return arr.length === 3 &&
            typeof arr[0] === 'string' &&
            typeof arr[1] === 'string' &&
            arr[2] !== undefined;
};
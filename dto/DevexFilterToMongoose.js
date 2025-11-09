/**
 * Tranforms filters from a Devextreme data table request to 
 * mongoose aware filters.
 */


// ====== CONFIG ======
const STRING_LOCALE = 'el'; // Greek locale (adjust if needed)

// ====== Helpers ======
function escapeRegex(s = '') {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Uppercase normalization for strings (to match your UPPERCASE data)
function normString(v) {
  return typeof v === 'string' ? v.toLocaleUpperCase(STRING_LOCALE) : v;
}

// Coerce to Date or Number when appropriate, else keep as-is
function toTypedValue(v) {
  
  if (v === null || v === undefined) return v;
  
  if (typeof v === 'number' || typeof v === 'boolean' || v instanceof Date) return v;

  if (typeof v === 'string') {
    
    const s = v.trim();
    const lower = s.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
      
    // ISO-like date?
    if (/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$/.test(s)) {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d;
    }
    // Number?
    const n = Number(s);
    if (!Number.isNaN(n) && s !== '') return n;
    return s;
  }
  return v;
}

// Build regex operands (no /i since we normalize to same case)
const buildRegexContains   = (val) => ({ $regex: escapeRegex(String(val)), $options: "i" });
const buildRegexStartsWith = (val) => ({ $regex: `^${escapeRegex(String(val))}`,  $options: "i"  });
const buildRegexEndsWith   = (val) => ({ $regex: `${escapeRegex(String(val))}$`, $options: "i"  });

// Normalize values for queries (arrays supported for IN/BETWEEN)
function normalizeValueForQuery(value) {
  if (Array.isArray(value)) return value.map(normalizeValueForQuery);
  const typed = toTypedValue(value);
  return typeof typed === 'string' ? normString(typed) : typed;
}

// ====== Term builder ======
function termToMongo([field, op, rawValue]) {
  const operator = String(op || '').toLowerCase();

  // DevExtreme sometimes passes arrays (between/in)
  const value = normalizeValueForQuery(rawValue);
  const typed = Array.isArray(value) ? value : toTypedValue(value);

  // String pattern operators (using normalized uppercase)
  if (operator === 'contains')    return { [field]: buildRegexContains(value) };
  if (operator === 'notcontains') return { [field]: { $not: buildRegexContains(value) } };
  if (operator === 'startswith')  return { [field]: buildRegexStartsWith(value) };
  if (operator === 'endswith')    return { [field]: buildRegexEndsWith(value) };

  // Equality / inequality
  if (operator === '=' || operator === '==') {
    const eqValue = toTypedValue(rawValue);
    if (typeof eqValue === 'string') {
        return { [field]: normString(rawValue) };
    }
    return { [field]: typed };
  }

  if (operator === '<>' || operator === '!=' || operator === 'notequals') {
    const neVal = toTypedValue(rawValue);
    if (typeof neVal === 'string') {
      return { [field]: { $ne: normString(neVal) } };
    }
    return { [field]: { $ne: neVal } };
  }

  // Comparisons (numbers/dates)
  if (operator === '>'  || operator === 'gt')  return { [field]: { $gt:  typed } };
  if (operator === '>=' || operator === 'gte') return { [field]: { $gte: typed } };
  if (operator === '<'  || operator === 'lt')  return { [field]: { $lt:  typed } };
  if (operator === '<=' || operator === 'lte') return { [field]: { $lte: typed } };

  // Null / blank
  if (operator === 'isnull')     return { [field]: null };
  if (operator === 'isnotnull')  return { [field]: { $ne: null } };
  if (operator === 'isblank')    return { [field]: { $in: [null, ''] } };
  if (operator === 'isnotblank') return { [field]: { $nin: [null, ''] } };

  // Membership (arrays)
  if (operator === 'in' || operator === 'anyof') {
    const arr = Array.isArray(value) ? value : [value];
    return { [field]: { $in: normalizeValueForQuery(arr) } };
  }
  if (operator === 'notin' || operator === 'noneof') {
    const arr = Array.isArray(value) ? value : [value];
    return { [field]: { $nin: normalizeValueForQuery(arr) } };
  }

  // Between (range) -> value should be [min, max]
  if (operator === 'between') {
    const [min, max] = Array.isArray(value) ? value : [undefined, undefined];
    const lo = toTypedValue(min);
    const hi = toTypedValue(max);
    const range = {};
    if (lo !== undefined && lo !== null) range.$gte = lo;
    if (hi !== undefined && hi !== null) range.$lte = hi;
    return { [field]: range };
  }

  // Fallback: treat strings as contains, others as equality
  if (typeof rawValue === 'string') {
    return { [field]: buildRegexContains(normString(rawValue)) };
  }
  return { [field]: typed };
}

// ====== Tokens → Mongo (supports "and"/"or" and nested arrays) ======
function tokensToMongo(tokens) {
 
  if (!Array.isArray(tokens) || tokens.length === 0) return {};

  const groups = []; // OR groups
  let current = [];  // AND list for current group
  let conj = 'and';
 
  for (const t of tokens) {
       
    if (typeof t === 'string') {
       
      const w = t.trim().toLowerCase();
      if (w === 'and' || w === 'or') conj = w;
      continue;
    }
     
    let expr = null;
    if (Array.isArray(t)) {
      // term (length 3) or nested group (arbitrary length)
      if (t.length === 3 && (typeof t[0] !== 'object')) {
        expr = termToMongo(t);
      } else {
        // nested group → recurse
        const nested = tokensToMongo(t);
        if (nested && Object.keys(nested).length) expr = nested;
      }
    }
    
    

    if (!expr) continue;

    if (conj === 'or') {
      if (current.length) groups.push(current);
      current = [expr];
      conj = 'and';
    } else {
      current.push(expr);
    }
  }
 
  if (current.length) groups.push(current);

  if (groups.length === 0) return {};
  if (groups.length === 1) {
    return groups[0].length === 1 ? groups[0][0] : { $and: groups[0] };
  }
  return { $or: groups.map(g => (g.length === 1 ? g[0] : { $and: g })) };
}

// ====== Public class ======
class DevexFilterToMongoose {
  /**
   * Accepts normalized DevExtreme tokens (array) and returns a single Mongo filter object.
   * Example:
   *   [ ['username','=','alex'], 'and', ['fullname','contains','val'], 'or', [ ['role','=','ADMIN'], 'and', ['active','=','1'] ] ]
   */
  transform(tokens) {
    return tokensToMongo(tokens);
  }
};

module.exports = DevexFilterToMongoose;

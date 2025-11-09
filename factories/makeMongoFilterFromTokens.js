const DevexFilterToMongoose = require('../dto/DevexFilterToMongoose');

//optional
/*
function parsePagingAndSort(q) {
  // paging
  const skip = Number(q.skip ?? 0) || 0;
  const limit = Number(q.take ?? 0) || 0; // 0 means "no limit" (you can default to 50 if you prefer)

  // sort (DevExtreme often sends JSON like: [{"selector":"username","desc":true}])
  // It can also send `sort[0][selector]=...` depending on config.
  let sort = undefined;

  if (q.sort) {
    try {
      const arr = typeof q.sort === 'string' ? JSON.parse(q.sort) : q.sort;
      if (Array.isArray(arr) && arr.length) {
        sort = {};
        for (const s of arr) {
          const selector = s.selector || s.field || s.column || s[0];
          if (!selector) continue;
          const desc = !!(s.desc ?? s.direction === 'desc' ?? s[1] === 'desc');
          sort[selector] = desc ? -1 : 1;
        }
      }
    } catch {
      // ignore malformed sort
    }
  } else {
    // bracket-notation fallback e.g. sort[0][selector], sort[0][desc]
    const selectors = [];
    Object.keys(q).forEach(k => {
      const m = /^sort\[(\d+)]\[(selector|desc|direction)]$/.exec(k);
      if (!m) return;
      const idx = Number(m[1]);
      selectors[idx] = selectors[idx] || {};
      selectors[idx][m[2]] = q[k];
    });
    if (selectors.length) {
      sort = {};
      for (const s of selectors) {
        if (!s) continue;
        const selector = s.selector;
        if (!selector) continue;
        const desc = s.desc === 'true' || s.direction === 'desc';
        sort[selector] = desc ? -1 : 1;
      }
    }
  }

  return { skip, limit, sort };
}

*/

function makeMongoFilterFromTokens({
    //produced by make filter normalizer
    fromAttach = 'runtimeFilters',
    fromKey = 'raw',
    // where to attach the buil values
    toAttach = 'flt',
    mongoKey = 'mongo'
//    optionsKey = 'options'
} = {}) {
    
    return function mongoFilterMiddleware(req, _res, next) {
       
    try {

      const tokens = req[fromAttach]?.[fromKey];
      const builder = new DevexFilterToMongoose();
      const mongo = Array.isArray(tokens) && tokens.length ? builder.transform(tokens) : {};
      req[toAttach] = req[toAttach] || {};
      req[toAttach][mongoKey] = mongo;
//      console.log(req['flt']['mongo']);
//      console.log(JSON.stringify(req['flt']['mongo'], null, 2));
      next();
    } catch (err) {
      
      next(err);
    }
  };
};


module.exports = makeMongoFilterFromTokens;
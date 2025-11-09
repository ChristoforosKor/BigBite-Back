// utils/findWithFilters.js

function splitFilterForReferences(filter, referenceFields = []) {
  const preMatch = {};
  const postMatch = {};

  function walk(obj, targetPre, targetPost) {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("$")) {
        if (Array.isArray(value)) {
          targetPre[key] = [];
          targetPost[key] = [];
          for (const v of value) {
            const subPre = {};
            const subPost = {};
            walk(v, subPre, subPost);
            if (Object.keys(subPre).length) targetPre[key].push(subPre);
            if (Object.keys(subPost).length) targetPost[key].push(subPost);
          }
          if (!targetPre[key].length) delete targetPre[key];
          if (!targetPost[key].length) delete targetPost[key];
        }
      } else {
        const top = key.split(".")[0];
        if (referenceFields.includes(top)) {
          targetPost[key] = value;
        } else {
          targetPre[key] = value;
        }
      }
    }
  }

  walk(filter, preMatch, postMatch);
  return { preMatch, postMatch };
}

function resultsWithFields(results) {
  return results.map(doc => {
    const newDoc = { ...doc };
    newDoc.rolesRef = doc.roles?.map(r => r.role).join(", ") || "";
    newDoc.colorsRef = doc.colors?.map(r => r.color).join(", ") || "";
    return newDoc;
  });
}

function resultsAggWithFields(results) {
  return results.map(doc => {
    const newDoc = { ...doc };
    if (doc.colors && Array.isArray(doc.colors.color)) {
      newDoc.colorsRef = doc.colors.color.join(", ");
      newDoc.colors = doc.colors.color.map((c, i) => ({
        color: c,
        _id: doc.colors._id[i]
      }));
    } else {
      newDoc.colorsRef = " ";
    }

    if (doc.roles && Array.isArray(doc.roles.role)) {
      newDoc.rolesRef = doc.roles.role.join(", ");
      newDoc.roles = doc.roles.role.map((r, i) => ({
        role: r,
        _id: doc.roles._id[i]
      }));
    } else {
      newDoc.rolesRef = " ";
    }
    return newDoc;
  });
}

function transformFilter(filter) {
  if (!filter || Object.keys(filter).length === 0) {
    return {};
  }

  if (filter.$and) {
    filter.$and = filter.$and.map(f => transformFilter(f));
  }
  if (filter.$or) {
    filter.$or = filter.$or.map(f => transformFilter(f));
  }

  if (filter.colorsRef) {
    filter["colors.color"] = filter.colorsRef;
    delete filter.colorsRef;
  }
  if (filter.rolesRef) {
    filter["roles.role"] = filter.rolesRef; // ✅ fixed
    delete filter.rolesRef;
  }

  return filter;
}

function extractSortFields(sort) {
  if (!sort) return [];
  if (Array.isArray(sort)) {
    return sort.map(s => s.selector.split(".")[0]);
  }
  return Object.keys(sort).map(k => k.split(".")[0]);
}

/**
 * Find documents with filters that may include reference lookups.
 *
 * @param {MongooseModel} Model - The mongoose model
 * @param {Object} filter - The plain mongo filter object
 * @param {Object} options - {sort, skip, limit}
 * @param {Object} config - {references: { fieldName:{ref: String, as: String, foreignField: String, fields: [String] } } }
 */
async function findWithFilters(Model, filter, options = {}, config = {}) {
  const { references = {}, forceAggregate = false } = config;
  const refFields = Object.keys(references);
  const { projection } = options || {};

  filter = transformFilter(filter);
  let { preMatch, postMatch } = splitFilterForReferences(filter, refFields);

  // Also check sorting on reference fields
  const sortFields = extractSortFields(options.sort);
  const needsRefSort = sortFields.some(f => refFields.includes(f));
  const needsAggregate = forceAggregate || Object.keys(postMatch).length > 0 || needsRefSort;

  // DEBUG: show mode
  // console.log("\n=== findWithFilters DEBUG ===");
  // console.log("Model:", Model.modelName);
  // console.log("Filter:", JSON.stringify(filter, null, 2));
  // console.log("PreMatch:", JSON.stringify(preMatch, null, 2));
  // console.log("PostMatch:", JSON.stringify(postMatch, null, 2));
  // console.log("References:", references);
  // console.log("Needs aggregate:", needsAggregate);
  // console.log("==============================\n");

  if (needsAggregate) {
    const stages = [];

    if (Object.keys(preMatch).length) {
      stages.push({ $match: preMatch });
    }

    for (const [field, { ref, as = field + "_ref", foreignField = "_id", fields }] of Object.entries(references)) {
      const touchesFilter = JSON.stringify(postMatch).includes(`"${field}.`);
      const touchesSort = sortFields.includes(field);
        let localFieldPath = field;
        const schemaPaths = Object.keys(Model.schema.paths);
        if (!schemaPaths.includes(field) && schemaPaths.includes(`${field}._id`)) {
          localFieldPath = `${field}._id`;
        }
        stages.push(
          { $lookup: { from: Model.db.model(ref).collection.name, localField: localFieldPath, foreignField, as } }
        );

        const isArrayField = field === "colors" || field === "roles";
        if (!isArrayField) {
          stages.push({
            $unwind: {
              path: "$" + as,
              preserveNullAndEmptyArrays: true
            }
          });
        }

        if (fields && fields.length) {
          stages.push({
            $addFields: {
              [as]: {
                $cond: {
                  if: { $ne: [`$${as}`, null] },
                  then: {
                    _id: `$${as}._id`,
                    ...fields.reduce((acc, f) => {
                      acc[f] = `$${as}.${f}`;
                      return acc;
                    }, {})
                  },
                  else: null
                }
              }
            }
          });
        }
        // --- Nested populate support (No ObjectId auto-convert) ---
        const nestedPopulate = references[field].populate;
        if (nestedPopulate && Array.isArray(nestedPopulate)) {
          for (const nested of nestedPopulate) {
            const nestedAs = `${as}_${nested.field}`;

            // If parent is an object, use path: `${as}.${nested.field}._id`
            // If parent is a string, use path: `${as}.${nested.field}`
            const nestedLocalFieldObject = `${as}.${nested.field}._id`;
            const nestedLocalFieldString = `${as}.${nested.field}`;

            // We allow both string or object ID, no conversion
            stages.push({
              $lookup: {
                from: Model.db.model(nested.ref).collection.name,
                let: {
                  parentFieldObj: `$${nestedLocalFieldObject}`,
                  parentFieldStr: `$${nestedLocalFieldString}`
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          { $eq: ["$_id", "$$parentFieldObj"] },
                          { $eq: ["$_id", "$$parentFieldStr"] }
                        ]
                      }
                    }
                  }
                ],
                as: nestedAs
              }
            });

            stages.push({
              $unwind: {
                path: `$${nestedAs}`,
                preserveNullAndEmptyArrays: true
              }
            });

            // Merge into parent
            if (nested.fields && nested.fields.length) {
              stages.push({
                $addFields: {
                  [`${as}.${nested.field}`]: {
                    _id: `$${nestedAs}._id`,
                    ...nested.fields.reduce((acc, f) => {
                      acc[f] = `$${nestedAs}.${f}`;
                      return acc;
                    }, {})
                  }
                }
              });
            } else {
              stages.push({
                $addFields: {
                  [`${as}.${nested.field}`]: `$${nestedAs}`
                }
              });
            }

            // Remove temporary nested lookup
            stages.push({ $unset: nestedAs });
          }
        }
        // --- End Nested populate support ---
        if (touchesFilter || touchesSort) {
                if (touchesFilter) {
                  const json = JSON.stringify(postMatch).replace(
                    new RegExp(`"${field}\\.`, "g"),
                    `"${as}.`
                  );
                  postMatch = JSON.parse(json);
                }

                if (touchesSort && options.sort) {
                  if (Array.isArray(options.sort)) {
                    options.sort = options.sort.map(s =>
                      s.selector.startsWith(field + ".")
                        ? { ...s, selector: s.selector.replace(field + ".", as + ".") }
                        : s
                    );
                  } else {
                    const rewritten = {};
                    for (const [k, v] of Object.entries(options.sort)) {
                      const newKey = k.startsWith(field + ".") ? k.replace(field + ".", as + ".") : k;
                      rewritten[newKey] = v;
                    }
                    options.sort = rewritten;
                  }
                }
      }
    }

    if (Object.keys(postMatch).length) {
      stages.push({ $match: postMatch });
    }

    stages.push({
      $facet: {
        results: [
          ...(options.sort
            ? [
                {
                  $sort: Array.isArray(options.sort)
                    ? options.sort.reduce((acc, { selector, desc }) => {
                        acc[selector] = desc ? -1 : 1;
                        return acc;
                      }, {})
                    : options.sort
                }
              ]
            : []),
          ...(options.skip ? [{ $skip: options.skip }] : []),
          ...(options.limit ? [{ $limit: options.limit }] : [])
        ],
        count: [{ $count: "value" }]
      }
    });

    stages.push({
      $project: {
        results: 1,
        count: { $ifNull: [{ $arrayElemAt: ["$count.value", 0] }, 0] }
      }
    });

    const [{ results, count }] = await Model.aggregate(stages);
    const res = resultsAggWithFields(results);
    return { results: res, count };
  }

  // Plain find()
  let query = Model.find(preMatch).lean();
  if (options.sort) query = query.sort(options.sort);
  if (options.skip) query = query.skip(options.skip);
  if (options.limit) query = query.limit(options.limit);

  for (const [field, { ref, as = field, fields, populate: nestedPopulate }] of Object.entries(references)) {
    const populateObj = { path: field };

    if (fields && fields.length) {
      populateObj.select = fields.join(" ");
    }

    if (nestedPopulate) {
      populateObj.populate = nestedPopulate.map(nested => {
        const obj = { path: nested.field };
        if (nested.fields && nested.fields.length) {
          obj.select = nested.fields.join(" ");
        }
        return obj;
      });
    }

    query = query.populate(populateObj);
  }

  const [results, count] = await Promise.all([query, Model.countDocuments(preMatch)]);
  const resultsFields = resultsWithFields(results);
  return { results: resultsFields, count };
}

module.exports = { findWithFilters };

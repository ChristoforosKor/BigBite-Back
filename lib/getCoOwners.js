
module.exports = async  function (id, model) {

  const doc = await model.findById(id).select('coOwners').lean().exec();
  const list = Array.isArray(doc?.coOwners) ? doc.coOwners : [];
  return list
    .filter(Boolean)
    .map(o => ({ _id: String(o._id), username: o.username }));
}


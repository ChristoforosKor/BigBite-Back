const mongoose = require("mongoose");

const makeEmbeddedFields = async (embedded, obj) => {

//  console.log('Registered models:', mongoose.modelNames());

    const embeddedObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const embedConf = embedded[key];
    
    if (embedConf) {
      const Model = mongoose.model(embedConf.ref);
       if (Array.isArray(value)) { 
        const docs = await Model.find(
          { _id: { $in: value } }, 
          embedConf.fields.join(" ")
        ).lean();
           embeddedObj[embedConf.as] = docs.map(doc => ({
          ...doc,
          _id: String(doc._id),
        }));;
      } else {
         if(!embedConf.populate){
        const doc = await Model.findOne(
          { _id: value },
          embedConf.fields.join(" ")
        ).lean();
        embeddedObj[embedConf.as] = doc
          ? { ...doc, _id: String(doc._id) } 
          : null;
           }else{
               const doc = await Model.findOne(
                { _id: value },
                embedConf.fields.join(" ")
              )
              .populate({
                path: embedConf.populate.field,   
                select:     embedConf.populate.fields 
              })
                       .lean();
                    if (doc) {
                const populatedField = embedConf.populate?.field;

                doc._id = String(doc._id);
          
                if (populatedField && doc[populatedField]?._id) {
                  doc[populatedField]._id = String(doc[populatedField]._id);
                }

                embeddedObj[embedConf.as] = doc;
              } else {
                embeddedObj[embedConf.as] = null;
              }
          }
     }
    }else {
      embeddedObj[key] = value;
    }
  }

  return embeddedObj;
}; 

module.exports.makeEmbeddedFields = makeEmbeddedFields;
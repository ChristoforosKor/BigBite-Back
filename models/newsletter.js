const {newsletterModel, newsletterValidation} = require("./schemas/newsletter");


module.exports.create = async (data) => {
    try {
        newsletterValidation(data);
        return await newsletterModel.create(data);
    } catch (error) {
        throw error;
    }
};


module.exports.find = async () => {
    try {
        return await newsletterModel.find();
    } catch (error) {
        throw error;
    }
};
module.exports.findById= async (id) => {
    try {
        return await newsletterModel.findOne();
    } catch (error) {
        throw error;
    }
};

module.exports.update = async (id, data) => {
    try {
        newsletterValidation(data);
        return await newsletterModel.findOneAndUpdate({_id: id}, data, {new : true});
    } catch (error) {
        throw error;
    }
};

module.exports.delete = async (id) => {
  try {
    return await newsletterModel.findOneAndDelete({ _id: id });
  } catch (error) {
    throw error;
  }
};

const {discountsModel, discountsValidation} = require("./schemas/discounts");


module.exports.create = async (data) => {
    try {
        discountsValidation(data);
        return await discountsModel.create(data);
    } catch (error) {
        throw error;
    }
};


module.exports.find = async () => {
    try {
        return await discountsModel.find();
    } catch (error) {
        throw error;
    }
};
module.exports.findById= async (id) => {
    try {
        return await discountsModel.findOne();
    } catch (error) {
        throw error;
    }
};

module.exports.update = async (id, data) => {
    try {
        discountsValidation(data);
        return await discountsModel.findOneAndUpdate({_id: id}, data, {new : true});
    } catch (error) {
        throw error;
    }
};

module.exports.delete = async (id) => {
  try {
    return await discountsModel.findOneAndDelete({ _id: id });
  } catch (error) {
    throw error;
  }
};

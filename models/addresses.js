const validateId = require("../lib/validateId");
const getCoOwners = require("../lib/getCoOwners");
const ENTITY = require("./entities").ADDRESSES;
const {
  prepareCreate,
  prepareUpdate,
  prepareRetrieve,
  prepareDelete,
} = require("../lib/sessionstorage");
const { listResults } = require("../lib/results");
const {addressModel , addressValidate}= require("./schemas/addresses");
const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client({});

module.exports.create = async (data) => {
    try {
  const result =  prepareCreate(ENTITY, data);
  addressValidate(result.data);
  return await addressModel.create(result.data);
   } catch (error) {
        throw error; 
    }
};

module.exports.getCoordinates = async (address) => {
  try {
    const response = await client.geocode({
      params: {
        address: address,
         key: 'AIzaSyAj2GCx6x_Z3kOioY5pXt3Os2mSosfX1E8',
         language: 'el'
      },
    });
    
    if (response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const data =  {
        latitude: location.lat,
        longitude: location.lng,
        address: response.data.results[0].formatted_address
      };
      return data;
    }
    return null;
  } catch (error) {
         throw error; 
  }
}

module.exports.getAddress = async (latitude, longitude) => {
  try {
    const response = await client.reverseGeocode({
      params: {
        latlng: `${latitude},${longitude}`,
        key: 'AIzaSyAj2GCx6x_Z3kOioY5pXt3Os2mSosfX1E8',
        language: 'el'
      },
    });

    if (response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        address: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng
      };
    }

    return null;
  } catch (error) {
    throw error;
  }
};



module.exports.update = async (id, data) => {
    try {
  validateId(id);
//   data.coOwners = await getCoOwners(id,addressModel);
  const result = prepareUpdate(ENTITY, data);
  addressValidate(result.data);
   const filters = {...result.filters, _id: id};
    const final =   await addressModel.findOneAndUpdate(filters, {$set : result.data})
     if(!final){
            const err = new Error("Δεν έχετε άδεια να αλλάξετε αυτό το σημείο συλλογής.");
            err.code = 4000;
            throw err;
          }
          return final;
     } catch (error) {
        throw error; 
    }
};

//module.exports.findById = async (id) => {;
//  validateId(id);
// // prepareRetrieve(ENTITY);
//  return await roleModel.findById(id).populate("parent", "_id, role");
//};

module.exports.find = async (filters, projection, ordering,paging ,populate) => {
    try {
  return await listResults(addressModel, ENTITY, filters,  projection, ordering, populate,paging);
  } catch (error) {
        throw error; 
    }
};

module.exports.delete = async (id) => {
    try {
 validateId(id);
  const data = prepareDelete(ENTITY);
  const filters = {...data.filters, _id: id};
  const result =  await addressModel.findOneAndDelete(filters);
      if (!result) {
            const err = new Error("You do not have permission to delete this address.");
            err.code = 4000;
            throw err;
          }
          return  result;
    } catch (error) {
        throw error;
    }
};


const axios = require('axios');
const config = require('config');
const CRMUrl = config.get('crmWeightEndPoint');

async function saveToCRM(bodyValue, bearerToken)
{
    try {
        const result = await axios.post(
                CRMUrl, bodyValue, {
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    }

                });

        return result;
    } catch (error) {
        return error;
    }
}

function convertArray(array) {

    responseArray = [];
    try {
        array.forEach((object) => {

            responseArray.push({
                bagCode: object.bulkMobileCouponBindingModel[0].bagCode,
                weight: object.bulkMobileCouponBindingModel[0].weight
            });
        });
        return {
            bulkMobileCouponBindingModel: responseArray
        };
    } catch (error) {
        console.log(error.message);
    }
}

function convertSingleWithId(object) {
    try {  
        return {
            _id: object._id,
            bulkMobileCouponBindingModel: [
                {
                    bagcode: object.qr_code,
                    weight: object.weight,
                }
            ],
        };
    } catch (error) {
        console.error("CRM.convertSingleWithId error:", error.message);
        return {
            _id: object._id,
            bulkMobileCouponBindingModel: [],
        };
    }
}

module.exports.saveToCRM = saveToCRM;
module.exports.convertArray = convertArray;
module.exports.convertSingleWithId = convertSingleWithId;
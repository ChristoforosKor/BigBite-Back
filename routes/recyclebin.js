const express = require('express');
const router = express.Router();
const Joi = require('joi');
const {Recyclebin, newLocationSchema} = require('../models/recyclebins');
const errorResponse = require('../lib/errorresponse');
const {validateLocation, getEveryLocation, getEveryBin, getSingleBin, getEveryFreeBin} = require('../middleware/recyclebins');

router.get('/', [getEveryBin], (req, res) => {
    //get the latest information for every bin
    //ΙΣΩΣ ΝΑ ΕΝΩΘΕΙ ΜΕ ΤΟ get('/locations')

});
router.get('/free', [getEveryFreeBin], (req, res) => {
    //get every information on locations
});
router.get('/:binId', [getSingleBin], (req, res) => {
    //get the latest information for every bin
    //ΙΣΩΣ ΝΑ ΕΝΩΘΕΙ ΜΕ ΤΟ get('/locations')

});
router.get('/locations', [getEveryLocation], (req, res) => {
    //get every information on locations
});
//router.post('/locations',[validateLocation], (req, res) => {
//    addLocationToDB(req.body);
//    //create new location with attached bin(s)
//});

router.delete('/locations/:locationName', (req, res) => {
    try {
        validateLocationName(req.params.locationName)
                .then(mongoRes => deleteBin(mongoRes, req.body.binId))
                .then(updatedObject => res.status(200).send(updatedObject))
                .catch(err => {
                    res.status(400).send(err);
//                new Error(err);
                });
    } catch (error) {
        errorResponse(res, error);
    }
});
router.put('/locations/:locationName', [], (req, res) => {
    //add a new bin to an existing location
//    validateLocationName(req.params.locationName)
    try {
        searchForBin(req.body.binId)
                .then((searchRes) => {
                    if (searchRes) {
                        updateLocation(req.params.locationName, req.body.binId)
                                .then((updateRes) => {
                                    res.status(200).send(updateRes);
                                }, (updateReject) => {
                                    addLocationToDB({
                                        binId: req.body.binId,
                                        locationName: req.params.locationName
                                    }).then((addRes) => {
                                        res.status(201).send(addRes);
                                    });
                                });
                    }
                }, (error) => {
                    console.log(error);
                    res.status(400).send({message: "Bin is already installed"});
                });
    } catch (error) {
        errorResponse(res, error);
    }

});
function validateLocationName(locationName) {
    try {
        return new Promise((resolve, reject) => {
            Recyclebin.aggregate([
                {
                    $match:
                            {
                                locationName: locationName
                            }
                },
                {
                    $project: {
                        _id: 1,
                        locationId: 0,
                        locationName: 0
//                    bins: 1
                    }
                }
            ]).then((res, err) => {
                if (res.length > 0) {
                    resolve({id: res[0]._id, bins: res[0].bins});
                } else {
                    reject('no document with the specified name found, could not alter bins');
                }
            });
        });
    } catch (error) {
        errorResponse(res, error);
    }
}
function searchForBin(binId) {
    try {
        return new Promise((resolve, reject) => {
            Recyclebin.aggregate([
                {
                    $unwind: "$bins"
                },
                {
                    $group: {
                        _id: {
                            bins: "$bins"
                        }
                    }
                },
                {
                    $match:
                            {
                                "_id.bins": binId
                            }
                }
            ]).then(res => {
                if (res.length > 0) {
                    reject(new Error('bin already saved to a location'));
                } else {
                    resolve(true);
                }
            });
        });
    } catch (error) {
        errorResponse(res, error);
    }
}

function updateLocation(locationName, binId) {
    try {
        const filter = {locationName: locationName};
        const update = {$push: {bins: binId}};
        return new Promise((resolve, reject) => {
            Recyclebin.updateOne(filter, update).then(res => {

                if (res.modifiedCount > 0) {
                    resolve(true);
                } else {
                    reject(new Error('Location was not updated'));
                }
            })
                    .catch(error => {
                        console.log("error");
                        reject(new Error(`unidentified problem while attempting to update the recyclebin document ${error}`));
                    });
        });
    } catch (error) {
        errorResponse(res, error);
    }
}

function addLocationToDB(locationInfo) {
    try {
        const location = new Recyclebin();
        location.locationName = locationInfo.locationName;
        location.bins = locationInfo.binId;
        return new Promise((resolve, reject) => {
            location.save()
                    .then(resolve())
                    .catch(error => reject(error));
        });
    } catch (error) {
        errorResponse(res, error);
    }
}

function deleteBin(recyclebinObject, binId) {
    try {
        return new Promise((resolve, reject) => {
            Recyclebin.findOneAndUpdate({_id: recyclebinObject.id}, {bins: recyclebinObject.bins.filter(element => element !== binId)}, {
                new : true
            })
                    .then(mongoRes => {
                        console.log(mongoRes.bins.length, recyclebinObject.bins.length);
                        if (mongoRes.bins.length !== recyclebinObject.bins.length) {

                            resolve(mongoRes);
                        } else {
                            reject(('length of bins[] before and after deletion is the same'));
                        }

                    })
                    .catch(error => reject(new Error(`unsuccessfull deletion ${error}`)));
        });
    } catch (error) {
        errorResponse(res, error);
    }
}
module.exports = router;
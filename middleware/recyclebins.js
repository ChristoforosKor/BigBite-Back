const {Recyclebin, newLocationSchema} = require('../models/recyclebins');
const {collection_point} = require('../models/collection_points');
function getEveryBin(req, res, next) {
    Recyclebin.aggregate(
            [
                {
                    $unwind: "$collection_points"
                },
                {
                    $lookup: {
                        from: "collection_points",
                        localField: "collection_points",
                        foreignField: "clientID",
                        as: "joinedData"
                    }
                },
                {
                    $unwind: "$joinedData"
                },
                {
                    $sort: {
                        "joinedData.timestamp": -1
                    }
                },
                {
                    $group: {
                        _id: "$joinedData.clientID",
                        locationId: {
                            $first: "$locationId"
                        },
                        locationName: {
                            $first: "$locationName"
                        },
                        battery: {
                            $first: "$joinedData.battery"
                        },
                        fill: {
                            $first: "$joinedData.fill"
                        },
                        location: {
                            $first: "$joinedData.location"
                        },
                        timestamp: {
                            $first: "$joinedData.timestamp"
                        }
                    }
                }
            ]
            ).exec()
            .then(mongoRes => res.send(mongoRes));
    next();
}

function getSingleBin(req, res, next) {
    Recyclebin.aggregate(
            [
                {
                    '$unwind': '$collection_points'
                }, {
                    '$match': {
                        'collection_points': req.params.binId
                    }
                }, {
                    '$lookup': {
                        'from': 'collection_points',
                        'localField': 'collection_points',
                        'foreignField': 'clientID',
                        'as': 'joinedData'
                    }
                }, {
                    '$unwind': '$joinedData'
                }, {
                    '$sort': {
                        'joinedData.timestamp': -1
                    }
                }, {
                    '$group': {
                        '_id': '$joinedData.clientID',
                        'locationId': {
                            '$first': '$locationId'
                        },
                        'locationName': {
                            '$first': '$locationName'
                        },
                        'battery': {
                            '$first': '$joinedData.battery'
                        },
                        'fill': {
                            '$first': '$joinedData.fill'
                        },
                        'location': {
                            '$first': '$joinedData.location'
                        },
                        'timestamp': {
                            '$first': '$joinedData.timestamp'
                        }
                    }
                }
            ]
            ).exec()
            .then(mongoRes => res.send(mongoRes));
    next();
}



function getEveryLocation() {
    const query = Recyclebin.find({});
    query.select('locationName collection_points');
    query.exec()
            .then(mongoRes => res.send(mongoRes));

}

function validateLocation(req, res, next) {
    const {value, error} = newLocationSchema.validate(req.body);
    const isLocationUnique = getLocationDetails(req.body.locationName).then(mongoRes => {
        if (value && mongoRes === true) {
            next();
        } else {
            res.status(400).send();
            console.log(`Unidentified error while attempting to create new Location ${error}`);
        }
    });
}

function getLocationDetails(locationName) {
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
                resolve({id: res[0]._id, bins: res[0].collection_points});
            } else {
                resolve(true);
            }
        });
    });
}

function getEveryFreeBin(req, res, next) {
    console.log("hello");
    return new Promise((resolve, reject) => {

        collection_point.aggregate([
            {
                $lookup: {
                    from: "recyclebins",
                    localField: "clientID",
                    foreignField: "collection_points",
                    as: "matchingDocs",
                },
            },
            {
                $match: {
                    matchingDocs: {
                        $size: 0,
                    }, // Filter out documents with no matching entries
                },
            },
            {
                $group:
                        {
                            _id: {
                                clientID: "$clientID",
                            },
                        },
            },
//            {
//                $match:
//                        {
//                            "_id.clientID": {
//                                $exists: true,
//                            },
//                        },
//            },
        ]).then((mongoRes, err) => {

            if (mongoRes.length > 0) {
                resolve(res.status(200).send(mongoRes));
            } else {
                resolve(res.status(404).send());
            }
        });
    });
    next();
}

module.exports.validateLocation = validateLocation;
module.exports.getEveryBin = getEveryBin;
module.exports.getEveryLocation = getEveryLocation;
module.exports.getSingleBin = getSingleBin;
module.exports.getEveryFreeBin = getEveryFreeBin;

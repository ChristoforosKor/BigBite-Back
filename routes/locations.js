const errorResponse = require('../lib/errorresponse');
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const {Location} = require('../models/locations');
const ENTITY = require("../models/entities").LOCATIONS;
const {
  prepareCreate,
  prepareUpdate,
  prepareRetrieve,
  prepareDelete,
} = require("../lib/sessionstorage");

router.get('/', (req, res) => {
    //prepareRetrieve(ENTITY);
    try {
        Location.aggregate([
            {
                $project:
                        {
                            name: 1,
                            _id: 0,
                        }
            }
        ])
                .then((mongoRes) => {
                    res.status(200).send(mongoRes);
                })
                .catch(err => console.log(err.message));
    } catch (error) {
        errorResponse(res, error);
    }
});

module.exports = router;
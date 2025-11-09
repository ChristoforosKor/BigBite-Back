const express = require('express');
const router = express.Router();
const logger = require('../lib/logger');
const pager = require('../middleware/pager');
const sorter = require('../middleware/sorter');
const permissionModel = require('../models/permissionsoptions');
const errorResponse = require('../lib/errorresponse');


router.get('/', [pager, sorter], async (req, res) => {
    try {
        const result = await permissionModel.find(req, res);
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);

    }
});




module.exports = router;
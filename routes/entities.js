const express = require("express");
const router = express.Router();
const logger = require("../lib/logger");
const pager = require("../middleware/pager");
const sorter = require("../middleware/sorter");
const filters = require("../middleware/filters");
const entitiesModel = require("../models/entities");
const errorResponse = require("../lib/errorresponse");

router.get("/", [pager, sorter, filters], async (req, res) => {
    const result = entitiesModel;
    res.status(200).send(result);
});


module.exports = router;

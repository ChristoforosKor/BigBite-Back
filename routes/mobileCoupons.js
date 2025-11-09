const express = require("express");
const router = express.Router();
const controller = require("../controllers/coupons");
const errorResponse = require("../lib/errorresponse");
const pager = require("../middleware/pager");
const sorter = require("../middleware/sorter");

router.get("/", [pager, sorter], async (req, res) => {
    try {
        const result = await controller.mobileFind(req, res);
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

module.exports = router;
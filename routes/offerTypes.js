const express = require("express");
const router = express.Router();
const logger = require("../lib/logger");
const pager = require("../middleware/pager");
const sorter = require("../middleware/sorter");
const filters = require("../middleware/filters");
const controller = require("../controllers/offerTypes");
const errorResponse = require("../lib/errorresponse");



router.post("/", async (req, res) => {
    try {
    const result = await controller.create(req,res);
    res.status(200).send(result);
    }catch (error) {
    errorResponse(res, error);
  }

});

router.put("/:id", async (req, res) => {
try {
    const result = await controller.update(req, res);
    res.status(200).send(result);
    }catch (error) {
    errorResponse(res, error);
  }

});

router.get("/:id", async (req, res) => {
try {
    const result = await controller.findById(req,res);
    res.status(200).send(result);
}catch (error) {
    errorResponse(res, error);
  }
});


router.get("/", [pager, sorter/*, filters*/], async (req, res) => {
    try {
    const result = await  controller.find(req,res);
    res.status(200).send(result);
    }catch (error) {
    errorResponse(res, error);
  }

});

router.delete("/:id", async (req, res) => {
    try {
    const result = await controller.delete(req, res);
    res.status(200).send(result);
    }catch (error) {
    errorResponse(res, error);
  }

});

module.exports = router;

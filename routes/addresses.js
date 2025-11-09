const express = require("express");
const router = express.Router();
const logger = require("../lib/logger");
const pager = require("../middleware/pager");
const sorter = require("../middleware/sorter");
const filters = require("../middleware/filters");
const controller = require("../controllers/addresses");
const errorResponse = require("../lib/errorresponse");



router.post("/", async (req, res) => {
    try {
    const result = await controller.create(req,res);
    res.status(200).send(result);
    }catch (error) {
    errorResponse(res, error);
  }

});

router.post("/get_coordinates", async (req, res) => {
    try {
    const result = await controller.getCoordinates(req,res);
    res.status(200).send(result);
    }catch (error) {
    errorResponse(res, error);
  }
});
router.post("/get_address", async (req, res) => {
    try {
    const result = await controller.getAddress(req,res);
    res.status(200).send(result);
    }catch (error) {
    errorResponse(res, error);
  }
});
router.get('/er/test-500-exception', (req, res, next) => {
  try {
    const err = new Error("Forced 500 error for testing");
    err.status = 501; // ✅ this will be picked up by your errorResponse
    throw err;

  } catch (error) {
    errorResponse(res, error);
  }
});

router.get('/er/test-500', (req, res) => {
  // Simulate a server error by sending status 500
  res.status(500).send('Internal Server Error - Test');
});
router.get('/er/test-501', (req, res) => {
  // Simulate a server error by sending status 500
  res.status(501).send('Internal Server Error - Test');
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

router.get("/", [pager, sorter, filters], async (req, res) => {
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

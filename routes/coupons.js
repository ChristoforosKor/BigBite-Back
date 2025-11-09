const express = require("express");
const router = express.Router();
const coupons = require("../controllers/coupons");
const errorResponse = require("../lib/errorresponse");
const pager = require("../middleware/pager");
const sorter = require("../middleware/sorter");
const filters = require("../middleware/filters");
const bodyFilterToMongo = require("../middleware/bodyFilterToMongo");
const formatFilenameDate = require("../lib/formatFilenameDate");


router.post("/", async (req, res) => {
    try {
        const result = await coupons.create(req, res);
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

router.put("/:id", async (req, res) => {
    try {
        const result = await coupons.update(req, res);
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

router.get("/", [pager, sorter /*, filters*/], async (req, res) => {
    try {
        const result = await coupons.find(req, res);
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

//const finalizeListResponse = (results) => {
////    console.log(JSON.stringify(results));
//    return results;
//};


router.get("/:id", async (req, res) => {
    try {
        const result = await coupons.findById(req, res);
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const result = await coupons.delete(req, res);
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

router.post("/export", [bodyFilterToMongo], async (req, res) => {
  try {
    const result = await coupons.export(req);
    const timestamp = formatFilenameDate();

    if (result.type === "excel") {
      const fileName = `export_${timestamp}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.status(200);

      // Ensure headers are sent before writing the workbook
      if (res.flushHeaders) res.flushHeaders();

      await result.workbook.xlsx.write(res);
      res.end(); // Always end stream
    } 
    else if (result.type === "zip") {
      const fileName = `export_${timestamp}.zip`;

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.status(200);
      res.send(result.buffer);
    } 
    else {
      res.status(500).json({ error: "Invalid export type returned" });
    }
  } catch (error) {
    errorResponse(res, error);
  }
});

module.exports = router;

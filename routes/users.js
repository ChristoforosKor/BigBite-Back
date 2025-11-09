const errorResponse = require("../lib/errorresponse");
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const config = require("config");
const {User, Validate} = require("../models/schemas/users");
const _ = require("lodash");
const controller = require('../controllers/users');
const express = require("express");
const router = express.Router();
const formatFilenameDate = require("../lib/formatFilenameDate");
const pager = require('../middleware/pager');
const sorter = require('../middleware/sorter');
const filters = require('../middleware/filters');
const bodyFilterToMongo = require("../middleware/bodyFilterToMongo");


router.get("/me", async (req, res) => {
    try {
        const result = await controller.findMe(req, res)
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

router.get('/confirm', async (req, res) => {
    try {
        const {email} = jwt.verify(req.query.token, config.get("secret"));

        const user = await User.findOne({username: email});
        if (!user)
            return res.redirect(config.get("front_url"));

        if (user.isConfirmed)
            return res.redirect(config.get("front_url"));
        user.isConfirmed = true;
        await user.save();

        return res.redirect(config.get("front_url"));
    } catch (err) {
        res.status(400).send('Η περίδος έληξε');
    }
});

router.get("/:id", async (req, res) => {
    try {
        
        const result = await controller.findById(req, res);
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

//app.use(makeFilterNormalizer());
//app.use(makeMongoFilterFromTokens());
router.get("/", [pager, sorter /*, filters*/], async (req, res) => {
//    console.log(req.filters);
//    console.log(req.filters.mongo);
//  
    try {
        const result = await controller.find(req, res);
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

router.post("/", async (req, res) => {
    try {
        const user = await controller.create(req, res);
        const token = user.generateTempToken();
        res
                .header(config.get("jwtPrivateKey"), token)
                .status(200)
                .send(_.pick(user, [
                    "_id",
                    "roles",
                    "household_members",
                    "birth_year",
                    "streetNo",
                    "zipCode",
                    "street",
                    "municipality",
                    "mobile_phone",
                    "fullname",
                    "username",
                    "organization",
                    "qr_codes"
                ]));
    } catch (error) {
        errorResponse(res, error);
    }
});

router.post("/requestPassword", async (req, res) => {
    const message= "Θα αποσταλούν οδηγίες στο mail που δηλώσατε εφόσον βρεθεί";
    try {
        const result = await controller.requestPassword(req, res);
        return res.status(200).send(message);
    } catch (error) {
        if (error.code === 40400) //@TODO move to central error handler 
            return res.status(200).send(message);
        if (error.code === 40000)
            return res.status(400).send(error.message);
        
        res.status(500).send('Παρουσιάστηκε σφάλμα');
    }
});

router.post("/registration", async (req, res) => {
    try {
        const user = await controller.register(req, res);
        const token = user.generateTempToken();
        res
            .header(config.get("jwtPrivateKey"), token)
            .status(200)
            .send(_.pick(user, [
                "_id",
                "roles",
                "household_members",
                "birth_year",
                "streetNo",
                "power_supply_number",
                "zipCode",
                "street",
                "municipality",
                "mobile_phone",
                "fullname",
                "username",
                "organization",
                "qr_codes"
                ]));
    } catch (error) {
        errorResponse(res, error);
    }
});
router.put("/resetPassword", async (req, res) => {
    try {
        const user = await controller.password(req, res);
        res.status(200).send(user);
    } catch (error) {
        errorResponse(res, error);
    }
});


router.put("/:id", async (req, res) => {
    try {
        const user = await controller.update(req, res);
        res.status(200).send(user);
    } catch (error) {
        errorResponse(res, error);
    }
});


router.delete("/:id", async (req, res) => {
    try {
        const result = await controller.delete(req, res);
        res.status(200).send(result);
    } catch (error) {
        errorResponse(res, error);
    }
});

router.post("/export", [bodyFilterToMongo], async (req, res) => {
  try {
    const result = await controller.export(req);
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

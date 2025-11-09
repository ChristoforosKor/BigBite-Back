const express = require('express');
const errorResponse = require('../lib/errorresponse');
const router = express.Router();
const tokens = require('../middleware/recycletokens');
const auth = require('../middleware/auth');
const authweight = require('../middleware/authweight');
const formatFilenameDate = require("../lib/formatFilenameDate");
const controller = require('../controllers/weights')
//const { produceWeightEvent } = require('../lib/kafkaProducer');
const ENTITY = require("./entities").WEIGHT;
const winston = require('winston');
const pager = require('../middleware/pager');
const sorter = require('../middleware/sorter');
const filters = require('../middleware/filters');
const bodyFilterToMongo = require("../middleware/bodyFilterToMongo");


router.get('/', [pager,sorter], async (req, res) => {
     const  result = await controller.find(req, res);
     res.status(200).send(result);
});

//
//router.get('/:id', (req, res) => {
//    const id = req.params.id;
//    res.send(`Requested weight ${id}`);
//});


router.post('/', async (req, res) => {
    try{
        const  result = await controller.create(req,res);
        res.status(201).send(result);
         } catch (error) {
        errorResponse(res, error);
    }
});

router.put('/:id', async (req, res) => {
    try{
        const  result = await controller.update(req,res);
        res.status(200).send(result);
         } catch (error) {
        errorResponse(res, error);
    }
});





function getEveryWeight() {
    try {
        return new Promise((resolve, reject) => {
            resolve(controller.Weight.aggregate([{
                    "$project": {
                        _id: 0, // Hide the field
                        clientID: 1, // Keep the _id field as is
                        weightInfo: {
                            bagCode: {"$arrayElemAt": ["$weightInfo.bagCode", 0]},
                            weight: {$divide:
                                        [{
                                                $toInt: {"$arrayElemAt":
                                                            ["$weightInfo.weight", 0]}}
                                            ,
                                            1000]}},
                        timestamp: 1  // Keep the timestamp field as is
                    }
                }]));
        });
    } catch (error) {
        errorResponse(res, error);
    }
}


router.post('/pda', async (req, res) => {
  
  try {
    const result =  await controller.batchCreate(req,res);
    res.status(201).send(result)
  } catch (error) {
        errorResponse(res, error);
    }

});

router.post('/pda/peiraias', async (req, res) => {
  
  try {
    const result =  await controller.CreatePdaPeiraias(req,res);
    res.status(201).send(result)
  } catch (error) {
        errorResponse(res, error);
    }

});

router.post('/pda/vvv', async (req, res) => {
  
  try {
    const result =  await controller.CreatePdaVvv(req,res);
    res.status(201).send(result)
  } catch (error) {
        errorResponse(res, error);
    }

});
router.delete('/:id', async (req, res) => {
  
  try {
    const result =  await controller.delete(req, res);
    res.status(200).send(result)
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

//async function createWeight(data, res) {
//    const service = new Service(data);
//    const result = await service.save();
//    console.log(result);
//    res.send(result);
//}

module.exports = router;

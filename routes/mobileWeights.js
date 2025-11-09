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


router.get('/:id', [pager,sorter], async (req, res) => {
    try{
     const  result = await controller.findOwn(req, res);
     res.status(200).send(result);
 }catch(error){
         errorResponse(res, error);

 }
});

//
//router.get('/:id', (req, res) => {
//    const id = req.params.id;
//    res.send(`Requested weight ${id}`);
//});


module.exports = router;

const config = require("config");
const mongoose = require("mongoose");
const {Weight, validateWeight,validateStagedWeights, validateWeights, validateBagCode, BagCode, StagedWeight} = require("./schemas/weights");
const {collectionPoint} = require("./collectionPoints");
const {codeModel} = require("./schemas/oldBagCodes");
const {produceCRMEvent} = require('../lib/kafkaProducer');
const {makeEmbeddedFields} = require("../lib/makeEmbeddedFields");
const CRM = require('./CRM');
const {User} = require('./users');
const {colorModel} = require('./schemas/colors');
const {clientSession} = require('./sessions');
const ENTITY = require("./entities").WEIGHTS;
const validateId = require('../lib/validateId')
const {listResults} = require("../lib/results");
const {
    setSessionData,
    flattenPermissions,
    anonymousSessionData,
    getSessionData,
} = require("../lib/sessionstorage");
const {
    prepareCreate,
    prepareUpdate,
    prepareRetrieve,
    prepareDelete,
} = require("../lib/sessionstorage");
const getNestedField = require("../lib/getNestedField");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");

async function saveWeight(data) {
    try {
        const record = data;
        console.log("Received post:", record);
        record.weightInfo[0].weight = String(record.weightInfo[0].weight * 10);
        console.log("Received new post:", record);

        const {error} = validateWeights(record);
        if (error) {
            console.log(`Invalid record skipped: ${error.message}`);
            winston.warn(`Invalid record skipped: ${error.message}`);
            return;
        }

        const getBin = await collectionPoint.findOne({
            clientID: record.clientID,
            organizationCode: {$exists: true, $ne: null}
        });

        const weightDoc = new Weight({
            status: [{"status": 'not send', "timestamp": new Date()}],
            organizationCode: getBin?.organizationCode || null,
            ...getWeight(record),
        });

        console.log("DEBUG - Final weight to save:", JSON.stringify(weightDoc.toObject(), null, 2));
        await weightDoc.save();
        console.log("Saved record:", weightDoc._id);

        //const binInfo = await outputBinInfo(record);
        //const binDoc = new collection_point(binInfo);
        //console.log('binDoc:', binDoc);
        //await binDoc.save();

        // Convert to CRM format (single object) and send
        const crmPayload = CRM.convertSingleWithId(weightDoc);
        await produceCRMEvent(crmPayload);

        // Update status to 'pending'
        await Weight.updateOne(
                {_id: weightDoc._id},
                {$push: {status: [{"status": 'pending', "timestamp": new Date()}]}}
        );

        console.log("Processed record:", weightDoc._id);

    } catch (err) {
        console.error("Error handling New Weight message:", err);
        winston.error(`New weight message error: ${err.message}`);
        throw err;
    }
}


function saveDocuments(documents) {
    return new Promise((resolve, reject) => {
        documents.forEach((document) => {
            const weightDoc = new Weight({
                status: [{"status": 'not send', "timestamp": new Date()}],
                ...getWeight(document),
            });
            const binDoc = new collectionPoint(getBinInfo(document));

            weightDoc.isNew = true;
            weightDoc.save();
            binDoc.save();
        });
        resolve();
    });
}

function getWeight(object) {
    return {
        weightInfo: object.bulkMobileCouponBindingModel || object.weightInfo,
        clientID: object.clientID
    };
}

function getBinInfo(object) {
    return {
        clientID: object.clientID,
        location: object.location,
        battery: object.battery,
        fill: object.fill,
    };
}

async function outputBinInfo(object) {
    const getBin = await collectionPoint.findOne({
        clientID: object.clientID,
        organization: {$exists: true, $ne: null}
    });

    return {
        clientID: object.clientID,
        organization: getBin?.organization || null,
        location: object.location,
        battery: object.battery,
        fill: object.fill,
    };
}

module.exports.batchCreate = async function (weight) {

    try {
//       throw new Error('ena error');
//        weight.client_type = "pda";
        const result = await StagedWeight.create(weight);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports.CreateMqttStagedWeight = async function (record) {
    try {
        let weight = {};
        weight.status= [{"status": 'not send', "timestamp": record.createdAt || new Date()}],
        weight.clientID = String(record.clientID);
        weight.type = 'mqtt';
        weight.qr_code = record.bulkMobileCouponBindingModel[0].bagCode;
        weight.weight = Number(record.bulkMobileCouponBindingModel[0].weight);
        weight.meta = {
            createdBy : record.user._id,
            updatedBy : record.user._id,
            createdAt : record.createdAt,
            updatedAt : record.updatedAt
        };
        weight.battery = Number(record.battery);
        weight.fill = Number(record.fill);
        weight.location = [record.location];
        weight.organization = record.organization;

        validateStagedWeights(weight);
        const result = await StagedWeight.create(weight);
        return result;
    } catch (error) {
        throw error;
    }
}
module.exports.mqttUpdateOne = async (filters = {}, updateData = {}) => {
    try {
        return await StagedWeight.findOneAndUpdate(filters, updateData, {new: true});
    } catch (error) {
        throw error;
    }
};

module.exports.CreateMqttWeight = async function (record){
    try {
        let weight = {};
        weight.device= record.device;
        weight.qr_code= record.bulkMobileCouponBindingModel[0].bagCode;
        weight.weight= Number(record.bulkMobileCouponBindingModel[0].weight);
        weight.organization= record.organization;
        weight.createdBy = record.user;
        validateWeights(weight);
        const result = await Weight.create(weight);
        return result;
    } catch (error) {
        console.error("Failed to save Weight document:", error);
        throw error;
    }
}

module.exports.CreatePdaPeiraias = async function (info) {

    try {
        let weight = {};
        weight.qr_code= info.qr_code;
        weight.clientID= info.clientID;
        weight.weight= info.weight;
        weight.meta ={ 
            createdBy : info.createdBy,
            updatedBy : info.updatedBy,
            createdAt : info.createdAt,
            updatedAt : info.updatedAt 
        };
        weight.status = [{status: "not send", timestamp: new Date()}];
        weight.type = "PDA";
        weight.organization = { _id : config.get("peiraiasId") , organizationName: 'ΔΗΜΟΣ ΠΕΙΡΑΙΑΣ' }
        validateStagedWeights(weight);
        const result = await StagedWeight.create(weight);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports.CreatePdaVvv = async function (info) {

    try {
        let weight = {};
        weight.qr_code= info.qr_code;
        weight.clientID= info.clientID;
        weight.weight= info.weight;
        weight.meta ={createdBy : info.createdBy,
            updatedBy : info.updatedBy,
            createdAt : info.createdAt,
            updatedAt : info.updatedAt 
    };
        weight.status = [{status: "not send", timestamp: new Date()}];
        weight.type = "PDA";
        weight.organization =config.get("vvvId");
        
        validateStagedWeights(weight);
        const result = await StagedWeight.create(weight);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports.create = async function (body, embedded) {

    try {
        
        const qr_code = body.qr_code;
  
        if( qr_code.length === 15){
        const  prepare = await prepareCreate(ENTITY, body)
        let info = prepare.data;
        const staged = { ...info };
        delete staged.collectionPoint;
        delete staged.weightDate;
         staged.type = "WEB-FORM";
         staged.done = true;
//         validateStagedWeights(staged);
//        await StagedWeight.create(staged);
        const color_code = info.qr_code.substring(4, 6);
        const color = await colorModel.find({code_number: color_code});
        if (!color.length){
             const error = new Error("Λάθος κωδικός qr.")
                  error.code = 4000;
                  throw error;
        }
        info.color = color[0]._id.toString();
       info = await makeEmbeddedFields(embedded, info) 
        validateWeights(info);
        const result = await  new Weight(info);
        await result.save();

        return result;
    }else{
            let prev = await Weight.findOne({qr_code: qr_code});
            if (prev) {
                  const error = new Error("Υπάρχει ήδη ζύγηση με αυτό το qr.")
                  error.code = 4000;
                  throw error;
               }
           const  prepare = await prepareCreate(ENTITY, body)
           const info = prepare.data;
            const staged = { ...info };
            delete staged.collectionPoint;
             delete staged.weightDate;
             staged.type = "WEB-FORM";
             staged.done = true;
            validateStagedWeights(staged);
            await StagedWeight.create(staged);
            const color_code = info.qr_code[4] + 0;
            const color = await colorModel.find({code_number: color_code});
             if (!color.length ){
             const error = new Error("Λάθος κωδικός qr.")
                  error.code = 4000;
                  throw error;
              }
            info.color = color[0]._id.toString() ;
            info = await makeEmbeddedFields(embedded, info) 
            validateWeights(info);
            const result = await  new Weight(info);
            await result.save();
            return result;

            }
    } catch (error) {
        throw error;
    }
}


module.exports.update = async function (id, data, embedded) {

    try {
        const weightId = id;
        validateId(weightId);
        const qr_code = data.qr_code;
        if( qr_code.length === 15){
        const info = await prepareUpdate(ENTITY, data);
        const prev = await Weight.findOne({_id: weightId});
        if (info.data.qr_code !== prev.qr_code) {
            const color_code = info.data.qr_code.substring(4, 6);
            const color = await colorModel.find({code_number: color_code});
               if (!color.length){
             const error = new Error("Λάθος κωδικός qr.")
                  error.code = 4000;
                  throw error;
              }
            info.data.color = color[0]._id.toString() ;
        }
        const filters = {...info.filters, _id: weightId}
       info.data = await makeEmbeddedFields(embedded, info.data) 
        const result = await Weight.findOneAndUpdate(filters, {$set: info.data})
         if (!result) {
            const err = new Error("Δεν έχετε άδεια να αλλάξετε αυτό το βάρος.");
                  err.code = 4000;
            throw err;
          }
        return result;
    }else{
         await StagedWeight.findOneAndUpdate({
              qr_code: qr_code,
                status: {
                  $not: {
                    $elemMatch: { status: "canceled" }
                  }
                }
              },
               {
                $push: {
                  status: {
                    status: "canceled",
                    timestamp: new Date()
                  }
                }
              },
    );
              const  prepare =  await prepareCreate(ENTITY, data)
           const info = prepare.data;
              const staged = { ...info };
              delete staged.collectionPoint;
              delete staged.weightDate;
             staged.type = "WEB-FORM";
             staged.done = true;
            validateStagedWeights(staged);
            await StagedWeight.create(staged);
            const color_code = info.qr_code[4] + 0;
            const color = await colorModel.find({code_number: color_code});
               if (!color.length){
             const error = new Error("Λάθος κωδικός qr.")
                  error.code = 4000;
                  throw error;
              }
            info.color = color[0]._id.toString() ;
            info = await makeEmbeddedFields(embedded) 
            validateWeights(info);
            const result = await  new Weight(info);
            await result.save();
            return result; 
            
            
    }
    } catch (error) {
        throw error;
    }
}
module.exports.count = async (filters) => {
    try {
        return await Weight.countDocuments(filters);
    } catch (error) {
        throw error;
    }
};
module.exports.find = async (filters, projection, paging, ordering, populate) => {
    const res =  await listResults(Weight, ENTITY, filters, projection, paging, ordering, {references: {}});
    return res;
};

module.exports.findOwn = async (filters, projection, paging, ordering, populate) => {
        const res =  await listResults(Weight, ENTITY, filters, projection, paging,populate, ordering);
        return {
            
        };
        
};
module.exports.delete = async (id) => {
    try {
        const data = prepareDelete(ENTITY);
        const filters = {...data.filters, _id: id};
        const result = await Weight.findOneAndDelete(filters);
       if (!result) {
           const err = new Error("Δεν έχετε άδεια να διαγράψετε αυτό το βάρος.");
                  err.code = 4000;
            throw err;
          }
          return  result;
    } catch (error) {
        throw error;
    }
};

module.exports.exportToExcel = async (filters, ordering) => {
  try {
    const excelFieldMap = [
        { key: "qr_code", label: "QR Κωδικοί" },
        { key: "weight", label: "Βάρος (g)" },
        { key: "weightDate", label: "Ημερομηνία Ζύγισης" },
        { key: "color.color", label: "Χρώμα" },
        { key: "device.title", label: "Συσκευή" },
        { key: "collectionPoint.title", label: "Τίτλος Σημείου Συλλογής" },
        { key: "collectionPoint.addresses.address", label: "Τοποθεσία Σημείου Συλλογής" },
        { key: "organization.organizationName", label: "Δήμος" },
        { key: "createdBy.username", label: "Δημιουργήθηκε από" },
        { key: "updatedBy.username", label: "Ενημερώθηκε από" },
        { key: "createdAt", label: "Ημερομηνία Δημιουργίας" },
        { key: "updatedAt", label: "Ημερομηνία Ενημέρωσης" }
    ];

    const populate = {};
    const projection = null;
    const config = { references: populate };

    // First, count total records
    const totalCount = await Weight.countDocuments(filters);

    // If <= 5000 → simple Excel
    if (totalCount <= 5000) {

      const paging = { skip: 0, limit: totalCount };
      const result = await listResults(Weight, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Ζυγίσεις");

      worksheet.columns = excelFieldMap.map((f) => ({
        header: f.label,
        key: f.key,
        width: 25,
      }));

       data.forEach((doc) => {
            const row = {};

            excelFieldMap.forEach(({ key }) => {
                let value = getNestedField(doc, key);

                if (value) {
                    let parsedDate = null;

                    // Case 1: Direct Date object
                    if (value instanceof Date) {
                        parsedDate = value;
                    }

                    // Case 2: String that looks like an ISO date (with or without Z)
                    else if (
                        typeof value === "string" &&
                        /^\s*"?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z"?\s*$/.test(value)
                    ) {
                        // Remove quotes & spaces just in case
                        const clean = value.trim().replace(/^"|"$/g, "");
                        const d = new Date(clean);
                        if (!isNaN(d)) parsedDate = d;
                    }

                    if (parsedDate) {
                        // Convert to local time
                        const offset = parsedDate.getTimezoneOffset() * 60000;
                        const localDate = new Date(parsedDate.getTime() - offset);
                        row[key] = localDate;
                    } else if (Array.isArray(value)) {
                        row[key] = value.join(", ");
                    } else if (typeof value === "boolean") {
                        row[key] = value ? "Ναι" : "Όχι";
                    } else {
                        row[key] = value ?? "";
                    }
                }
            });

            const newRow = worksheet.addRow(row);

            // --- Apply date format intelligently ---
            excelFieldMap.forEach(({ key }) => {
                const cell = newRow.getCell(key);
                const cellValue = row[key];

                if (cellValue instanceof Date) {
                const hasTime =
                    cellValue.getUTCHours() !== 0 ||
                    cellValue.getUTCMinutes() !== 0 ||
                    cellValue.getUTCSeconds() !== 0;

                cell.numFmt = hasTime ? "dd/mm/yyyy hh:mm" : "dd/mm/yyyy";
                }
            });
        });

        return { type: "excel", workbook };
    }

    // If > 5000 → chunk into ZIP
    const zip = new JSZip();
    const limit = 5000;
    let skip = 0;
    let batch = 1;

    while (skip < totalCount) {
      const paging = { skip, limit };
      const result = await listResults(Weight, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      if (!data.length) break;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Ζυγίσεις ${batch}`);
      worksheet.columns = excelFieldMap.map((f) => ({
        header: f.label,
        key: f.key,
        width: 25,
      }));

      data.forEach((doc) => {
            const row = {};

            excelFieldMap.forEach(({ key }) => {
                let value = getNestedField(doc, key);

                if (value) {
                    let parsedDate = null;

                    // Case 1: Direct Date object
                    if (value instanceof Date) {
                        parsedDate = value;
                    }

                    // Case 2: String that looks like an ISO date (with or without Z)
                    else if (
                        typeof value === "string" &&
                        /^\s*"?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z"?\s*$/.test(value)
                    ) {
                        // Remove quotes & spaces just in case
                        const clean = value.trim().replace(/^"|"$/g, "");
                        const d = new Date(clean);
                        if (!isNaN(d)) parsedDate = d;
                    }

                    if (parsedDate) {
                        // Convert to local time
                        const offset = parsedDate.getTimezoneOffset() * 60000;
                        const localDate = new Date(parsedDate.getTime() - offset);
                        row[key] = localDate;
                    } else if (Array.isArray(value)) {
                        row[key] = value.join(", ");
                    } else if (typeof value === "boolean") {
                        row[key] = value ? "Ναι" : "Όχι";
                    } else {
                        row[key] = value ?? "";
                    }
                }
            });

            const newRow = worksheet.addRow(row);

            // --- Apply date format intelligently ---
            excelFieldMap.forEach(({ key }) => {
                const cell = newRow.getCell(key);
                const cellValue = row[key];

                if (cellValue instanceof Date) {
                const hasTime =
                    cellValue.getUTCHours() !== 0 ||
                    cellValue.getUTCMinutes() !== 0 ||
                    cellValue.getUTCSeconds() !== 0;

                cell.numFmt = hasTime ? "dd/mm/yyyy hh:mm" : "dd/mm/yyyy";
                }
            });
        });

      const buffer = await workbook.xlsx.writeBuffer();
      zip.file(`export_part_${batch}.xlsx`, buffer);

      skip += limit;
      batch++;
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    return { type: "zip", buffer: zipBuffer };
  } catch (error) {
    throw error;
  }
};



exports.saveDocuments = saveDocuments;
exports.saveWeight = saveWeight;
exports.validateWeights = validateWeights;
exports.validateWeight = validateWeight;
exports.getWeight = getWeight;
exports.outputBinInfo = outputBinInfo;
exports.StagedWeight = StagedWeight;
exports.Weight = Weight;
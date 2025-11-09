const ENTITY = require("./entities").DEVICES;
const {
  prepareCreate,
  prepareUpdate,
  prepareRetrieve,
  prepareDelete,
} = require("../lib/sessionstorage");
const { listResults } = require("../lib/results");
const validateId = require("../lib/validateId");
const getCoOwners = require("../lib/getCoOwners");
const {deviceModel, devicePDAValidation , deviceBinValidation}= require("./schemas/devices");
const getNestedField = require("../lib/getNestedField");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");
const {deviceTypesModel}= require("./schemas/deviceTypes");
const {makeEmbeddedFields} = require("../lib/makeEmbeddedFields");

function validateDevice(data) {
            if(data.type === "PDA"){
            devicePDAValidation(data);
            }else {
                deviceBinValidation(data);
          }
}


module.exports.create = async (data, embedded) => {
    try {
                const devType = await deviceTypesModel.findOne({type: data.type});
                 data.type = devType._id;
         const result = await  prepareCreate(ENTITY, data);
        const res =  await makeEmbeddedFields(embedded, result.data) ;
       validateDevice(res);
  return await deviceModel.create(res);
    } catch (error) {
     throw   error;
    }
};

module.exports.update = async (id, data, embedded) => {
    try {
  validateId(id);
//     data.coOwners = await getCoOwners(id,deviceModel);
        const devType = await deviceTypesModel.findOne({type: data.type});
        data.type = devType._id;
        const result =  await prepareUpdate(ENTITY, data);
           const res =  await makeEmbeddedFields(embedded, result.data) ;
        validateDevice(res);
       const filters = {...result.filters, _id: id};

        const final =await deviceModel.findOneAndUpdate(filters, {$set : res})
            if (!final) {
                const err = new Error("Δεν έχετε άδεια να αλλάξετε αυτή την συσκευή.");
               err.code = 4000;
                throw err;
              }
              return  result;
    } catch (error) {
       throw  error;
    }
};


//module.exports.findById = async (id) => {;
//  validateId(id);
// // prepareRetrieve(ENTITY);
//  return await roleModel.findById(id).populate("parent", "_id, role");
//};

module.exports.find = async (filters, projection, ordering,paging ,populate) => {
    if (filters.hasOwnProperty('organization.organizationName' )) {
        filters['organization.organizationType'] = {'$eq': 'municipality'};
    }
    
    const res =  await listResults(deviceModel, ENTITY, filters, projection, paging, ordering, {references: populate});
    return res;

};

module.exports.updateOne = async (filters = {}, updateData = {}) => {
  try {
    return await deviceModel.findOneAndUpdate(filters, updateData, {new: true});
  } catch (error) {
    throw error;
  }
};

module.exports.findOne = async (filters = {}) => {
  try {
    return await deviceModel.findOne(filters);
  } catch (error) {
    throw error;
  }
};

module.exports.delete = async (id) => {
    try {
     validateId(id);
        const data = prepareDelete(ENTITY);
        const filters = {...data.filters, _id: id};
        const result =  await deviceModel.findOneAndDelete(filters);
     if (!result) {
            const err = new Error("Δεν έχετε άδεια να διαγράψετε αυτή την συσκευή.");
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
        { key: "deviceId", label: "Κωδικός Συσκευής" },
        { key: "title", label: "Τίτλος" },
        { key: "type.type", label: "Τύπος Συσκευής" },
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
    const totalCount = await deviceModel.countDocuments(filters);

    // If <= 5000 → simple Excel
    if (totalCount <= 5000) {

      const paging = { skip: 0, limit: totalCount };
      const result = await listResults(deviceModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Συσκευές");

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
      const result = await listResults(deviceModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      if (!data.length) break;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Συσκευές ${batch}`);
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
const ENTITY = require("./entities").COLORS;
const {
  prepareCreate,
  prepareUpdate,
  prepareRetrieve,
  prepareDelete,
} = require("../lib/sessionstorage");
const { listResults } = require("../lib/results");
const validateId = require("../lib/validateId");
const getCoOwners = require("../lib/getCoOwners");
const {colorModel , colorValidate}= require("./schemas/colors");
const getNestedField = require("../lib/getNestedField");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");

module.exports.create = async (data) => {
    try {
 const code = data.code_number;
  const result =  await prepareCreate(ENTITY, data);
  let c_code = await colorModel.findOne({code_number: code});
   if (c_code ){
        const error = new Error("Ο κωδικός χρώματος υπάρχει ήδη")
        error.code = 4000;
        throw error;
   }
  colorValidate(result.data);
  return await colorModel.create(result.data);
    } catch (error) {
     throw   error;
    }
};

module.exports.update = async (id, data) => {
    try {
  validateId(id);
  const prev = await colorModel.findOne({_id:id})
  if(prev.code_number !== data.code_number){
      let c_code = await colorModel.findOne({code_number:  data.code_number});
         if (c_code ){
        const error = new Error("Ο κωδικός χρώματος υπάρχει ήδη")
        error.code = 4000;
        throw error;
   }
  }
//   data.coOwners = await getCoOwners(id,colorModel);
  const result = await prepareUpdate(ENTITY, data);
  colorValidate(result.data);
   const filters = {...result.filters, _id: id};
    const final =  await colorModel.findOneAndUpdate(filters, {$set : result.data})
     if(!final){
            const err = new Error("Δεν έχετε άδεια να αλλάξετε αυτό το χρώμα.");
            err.code = 4000;
            throw err;
          }
      return final;
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
    const res =  await listResults(colorModel, ENTITY, filters, projection, paging, ordering, {references: populate});
    return res;
};

module.exports.delete = async (id) => {
    try {
     validateId(id);
  const data = prepareDelete(ENTITY);
  const filters = {...data.filters, _id: id};
  const result =  await colorModel.findOneAndDelete(filters);
     if (!result) {
            const err = new Error("Δεν έχετε άδεια να διαγράψετε αυτό το χρώμα.");
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
        { key: "color", label: "Χρώμα" },
        { key: "code_number", label: "Κωδικός" },
        { key: "type", label: "Τύπος" },
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
    const totalCount = await colorModel.countDocuments(filters);

    // If <= 5000 → simple Excel
    if (totalCount <= 5000) {

      const paging = { skip: 0, limit: totalCount };
      const result = await listResults(colorModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Χρώματα");

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
      const result = await listResults(colorModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      if (!data.length) break;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Χρώματα ${batch}`);
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
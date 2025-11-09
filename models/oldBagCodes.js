const ENTITY = require("./entities").OLDCODES;
const {
  prepareCreate,
  prepareUpdate,
  prepareRetrieve,
  prepareDelete,
} = require("../lib/sessionstorage");
const { listResults } = require("../lib/results");
const validateId = require("../lib/validateId");
const {getSessionData}  = require("../lib/sessionstorage");
const getCoOwners = require("../lib/getCoOwners");
const {codeModel , codeValidate}= require("./schemas/oldBagCodes");
const {colorModel }= require("./schemas/colors");
const {makeEmbeddedFields} = require("../lib/makeEmbeddedFields");
const {User} = require("./schemas/users");

const getNestedField = require("../lib/getNestedField");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");


 function getRandomUppercaseLetter(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let i = 0; i < length; i++) {
        const randomInd = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomInd);
    }
    return result;
}
 function getRandomNumbers(length) {
    let result = '';
    const characters = '0123456789';
    
    for (let i = 0; i < length; i++) {
        const randomInd = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomInd);
    }
    return result;
}



module.exports.createMany = async (body, embedded) => {
    try {
           const res = await prepareCreate(ENTITY, body);
           let data = res.data;
           let codes = [];
           let code = "";
           const prefix = data.prefix;
           const times = Math.ceil(data.number / 30);
           const color = await colorModel.findOne({_id: data.color});
           const str = color.code_number;
           const color_code = str.substring(0, str.length - 1);
           const groupCode = getRandomUppercaseLetter() + prefix + color_code;
           let letter = ' ';
           let letters = ' ';
           let numbers = ' ';
           data =  await makeEmbeddedFields(embedded, data)
        for (let i = 0; i < times; i++) {
               letter = getRandomUppercaseLetter(1);
               numbers  = getRandomNumbers(6);
              const repeat = (i === times - 1) ? (data.number  % 30 || 30) : 30;
               for (let i = 0; i < repeat; i++) {
                   letters = getRandomUppercaseLetter(2);
                   code = letter + groupCode + numbers + letters;
                  codeValidate({...data, code : code})
                   codes.push({...data, code: code});
                   
            }     
        }
        const result = await codeModel.insertMany(codes);
        return result;
    } catch (error) {
     throw   error;
    }
};

module.exports.update = async (id, data, embedded) => {
    try {
  validateId(id);
  const  result = await prepareUpdate(ENTITY, data);
   const filters = {...result.filters, _id: id};
   const embeddedData =  await makeEmbeddedFields(embedded, result.data)
   const final =  await codeModel.findOneAndUpdate(filters, {$set : embeddedData})
     if(!final){
            const err = new Error("Δεν έχετε άδεια να αλλάξετε αυτό τoν κωδικό.");
            err.code = 4000;
            throw err;
          }
      return final;
    } catch (error) {
       throw  error;
    }
};

module.exports.addUser = async ( data) => {
    try {
            const session =getSessionData();
              const organization= session.organization;
              const user = session.session.user;
              const code = data.code;
              const result = await codeModel.findOne({ code: code });
            if(!result){
                    const err = new Error("Αυτός ο κωδικός δεν υπάρχει");
                err.code = 4000;
                throw err;
            }
            if(Object.keys(result.user).length === 0){
                const err = new Error("Αυτός ο κωδικός είναι ήδη κατοχυρωμένος");
                err.code = 4000;
                throw err;
            }
            const qr_code = code.slice(0, -2);
            const regex = new RegExp(`^${qr_code}`);
            const filters = {code: { $regex: regex }};
            const updated = await codeModel.updateMany(
                  filters,
                  [
                    {
                      $set: {
                        user: user,
                        coOwners: user,
                        organization: {
                          $cond: [
                            { $ifNull: ["$organization", false] },  // CONDITION AN DEN EINAI FALSE
                            "$organization"  ,                               // THEN  VALE TON PRIN
                            organization                                    //ELSE KAINOURIO
                              ]
                        }
                      }
                    }
                  ]
                );
       return updated;
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
    const res =  await listResults(codeModel, ENTITY, filters, projection, paging, ordering, {references: populate});
    return res;
};

module.exports.delete = async (id) => {
    try {
     validateId(id);
  const data = prepareDelete(ENTITY);
  const filters = {...data.filters, _id: id};
  const result =  await codeModel.findOneAndDelete(filters);
     if (!result) {
            const err = new Error("Δεν έχετε άδεια να διαγράψετε αυτό τον κωδικό.");
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
      { key: "code", label: "Κωδικός" },
      { key: "prefix", label: "Καρτέλα" },
      { key: "color.color", label: "Χρώμα" },
      { key: "organization.organizationName", label: "Δήμος" },
      { key: "user.username", label: "Χρήστης" },
      { key: "createdBy.username", label: "Δημιουργήθηκε από" },
      { key: "updatedBy.username", label: "Ενημερώθηκε από" },
      { key: "createdAt", label: "Ημερομηνία Δημιουργίας" },
      { key: "updatedAt", label: "Ημερομηνία Ενημέρωσης" },
    ];

    const populate = {};
    const projection = null;
    const config = { references: populate };

    // First, count total records
    const totalCount = await codeModel.countDocuments(filters);

    // If <= 5000 → simple Excel
    if (totalCount <= 5000) {

      const paging = { skip: 0, limit: totalCount };
      const result = await listResults(codeModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Κωδικοί QR");

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
      const result = await listResults(codeModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      if (!data.length) break;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Κωδικοί QR ${batch}`);
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
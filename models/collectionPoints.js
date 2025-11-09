const validateId = require("../lib/validateId");
const getCoOwners = require("../lib/getCoOwners");
const ENTITY = require("./entities").COLLECTION_POINTS;
const {
  prepareCreate,
  prepareUpdate,
  prepareRetrieve,
  prepareDelete,
} = require("../lib/sessionstorage");
const { listResults } = require("../lib/results");
const {collectionPoint , collectionPointValidate}= require("./schemas/collectionPoints");
const {addressModel }= require("./schemas/addresses");
const {makeEmbeddedFields} = require("../lib/makeEmbeddedFields");
const c = require("config");
const getNestedField = require("../lib/getNestedField");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");

module.exports.create = async (data, embedded) => {
   
    try {
        console.log(data)
              if (data.devices && data.devices.length > 0) {
                    const devices = await collectionPoint.findOne({
                        "devices._id": { $in: data.devices }
                    });
                      if (devices) {
                               const err =  new Error("Μία ή περισσότερες συσκευές είναι ήδη αντιστοιχισμένες σε άλλο σημείο συλλογής.");
                              err.code = 4000;
                          throw err;
    }           }
            const populated =  await makeEmbeddedFields(embedded, data) ;
            let address = await addressModel.findOne({address: data.address.address}); 
            if(!address){
                address = await addressModel.create(data.address);
            };
            const addresses = {
                _id : address._id.toString(),
                address: address.address, 
                latitude: address.latitude,
                longitude: address. latitude
            };
            populated.addresses = addresses;
            delete populated.address;
            
//            const final_data = { title:  data.title, devices: data.devices, organization: data.organization, addresses: address._id.toString() };
//            console.log('---------------------------------');
//            console.log(final_data);
//            let info  = await prepareCreate(ENTITY, final_data);
            let info  = await prepareCreate(ENTITY, populated);
//            info = await makeEmbeddedFields(embedded, info) ;
//            console.log(info);
//            console.log('==================================');
//            collectionPointValidate(info);
            collectionPointValidate(info.data);
          
            return await collectionPoint.create(info.data);
              } catch (error) {
                  throw  error;
              }
};

module.exports.update = async (id, data, embedded) => {
    try {
            validateId(id);

            let address = await addressModel.findOne({address: data.address.address});
            if(!address){
                address = await addressModel.create(data.address)
            };
            const addresses = {
                _id : address._id.toString(),
                address: address.address,
                latitude: address.latitude,
                longitude: address. latitude
            };
            const final_data = {title: data.title, devices: data.devices, organization: data.organization, addresses: addresses };
            // final_data.coOwners = await getCoOwners(id,collectionPoint);
            if (data.devices && data.devices.length > 0) {
                const devices = await collectionPoint.findOne({
                    _id: { $ne: id },
                    "devices._id": { $in: data.devices }
                });
                  if (devices) {
                           const err =  new Error("Μία ή περισσότερες συσκευές είναι ήδη αντιστοιχισμένες σε άλλο σημείο συλλογής.");
                          err.code = 4000;
                      throw err;
                  }
            }

            const info = await prepareUpdate(ENTITY, final_data)
            const populated =  await makeEmbeddedFields(embedded, info.data) ;

            const filters = {...info.filters, _id: id}
            const result =  await collectionPoint.findOneAndUpdate(filters, {$set :populated});
                 if(!result){
                        const err = new Error("Δεν έχετε άδεια να αλλάξετε αυτό το σημείο συλλογής.");
                        err.code = 4000;
                        throw err;
          }
    } catch (error) {
        throw error;
    }
};

module.exports.findAllRaw = async () => {
  try {
    return await collectionPoint.find();
  } catch (error) {
    throw error;
  }
};
module.exports.findOne = async (filters = {}) => {
  try {
    return await collectionPoint.findOne(filters);
  } catch (error) {
    throw error;
  }
};
module.exports.updateOne = async (filters = {}, updateData = {}) => {
  try {
    return await collectionPoint.findOneAndUpdate(filters, updateData, {new: true});
  } catch (error) {
    throw error;
  }
};
module.exports.find = async (filters, projection, paging, ordering, populate) => {

    if (filters.hasOwnProperty('organization.organizationName' )) {
        filters['organization.organizationType'] = {'$eq': 'municipality'};
    }

    const res =  await listResults(collectionPoint, ENTITY, filters, projection, paging, ordering, {references: populate});
    return res;

};
module.exports.findLocation = async () => {
    try {

  const  info = prepareRetrieve(ENTITY);
  return await collectionPoint.find(info.filters).select('address');
    } catch (error) {
       throw  error;
    }
};
module.exports.findFull= async () => {
    try {
  const info = prepareRetrieve(ENTITY);
  const filters = {
              ...info.filters , fill:{$gte:80}
  };
  return await collectionPoint.find(filters).populate('address');
    } catch (error) {
       throw  error;
    }
};

module.exports.delete= async (id) => {
    try {
      const data =prepareDelete(ENTITY); 
     const filters = {...data.filters, _id: id};
    const result = await collectionPoint.findOneAndDelete(filters);
    if(!result){
            const err = new Error("Δεν έχετε άδεια να διαγράψετε αυτό το σημείο συλλογής.");
            err.code = 4000;
            throw err;
          }
    return result;
    } catch (error) {
        throw error; 
    }
};

module.exports.exportToExcel = async (filters, ordering) => {
  try {
    const excelFieldMap = [
        { key: "_id", label: "Αναγνωριστικό" },
        { key: "title", label: "Τίτλος" },
        { key: "addresses.address", label: "Τοποθεσία" },
        { key: "devices.title", label: "Συσκευές" },
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
    const totalCount = await collectionPoint.countDocuments(filters);

    // If <= 5000 → simple Excel
    if (totalCount <= 5000) {

      const paging = { skip: 0, limit: totalCount };
      const result = await listResults(collectionPoint, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Σημεία Συλλογής");

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
      const result = await listResults(collectionPoint, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      if (!data.length) break;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Σημεία Συλλογής ${batch}`);
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
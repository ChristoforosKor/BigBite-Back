const ENTITY = require("./entities").ORGANIZATIONS;
const ENTITY2 = require("./entities").PARTNERS;
const validateId = require("../lib/validateId");
const {
    prepareCreate,
    prepareUpdate,
    prepareRetrieve,
    prepareDelete,
} = require("../lib/sessionstorage");
const getCoOwners = require("../lib/getCoOwners");
const {listResults} = require("../lib/results");
const {organizationModel, organizationValidate, organizationPartnerValidate} = require('./schemas/organizations');
const {partnerModel} = require('./schemas/partnerTypes');
const {makeEmbeddedFields} = require("../lib/makeEmbeddedFields");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");
const c = require("config");
const getNestedField = require("../lib/getNestedField");


module.exports.create = async (data, embedded) => {
    try {
        let prev_org = data.organization ? 1 : 0;
        const result = await prepareCreate(ENTITY, data);
        const code = result.data.organizationCode;
        let organization = await organizationModel.findOne({organizationCode: code});
        if (organization) {
            const error = new Error("Ο συγκεκριμένος κωδικός οργανισμού έχει ήδη καταχωρηθεί.");
            error.code = 4000;
            throw error;
        }
        let final_data = {...result.data, organizationType: "municipality"};
        final_data = await makeEmbeddedFields( embedded,final_data);
        organizationValidate(final_data);
        if (!prev_org) {
            const res = await organizationModel.create(final_data);
            res.organization = {_id: res._id, organizationName: res.organizationName};
            await res.save();
            return res;
        } else {
            const org = await organizationModel.findOne({ _id: data.organization});
            final_data.organization = {_id: org._id, organizationName: org.organizationName};
            return await organizationModel.create(final_data);
        }
    } catch (error) {
        throw error;
    }
};

module.exports.update = async (id, data, embedded) => {
    try {
        validateId(id);
        data.coOwners = await getCoOwners(id, organizationModel);
        const result = await prepareUpdate(ENTITY, data);
        console.log(result.data);
        result.data = await makeEmbeddedFields( embedded,result.data);
        organizationValidate(result.data);
        const filters = {...result.filters, _id: id};
        const final = await organizationModel.findOneAndUpdate(filters, {$set: result.data})
        if (!final) {
            const err = new Error("Δεν έχετε άδεια να αλλάξετε αυτό τον οργανισμό.");
            err.code = 4000;
            throw err;
        }
        return final;
    } catch (error) {
        throw error;
    }
};
//
//module.exports.findById = async (id) => {
//  validateId(id);
//  //prepareRetrieve(ENTITY);
//  return await organizationModel.findById(id);
//};

module.exports.findOne = async (id, organizationType) => {
    try {
        validateId(id);
        return await organizationModel.findOne({_id: id, organizationType});
    } catch (error) {
        throw error;
    }
};

module.exports.find = async (
        filters,
        projection,
        paging,
        ordering,
        populate,
        ) => {

        filters['organizationType'] = {'$eq': 'municipality'};
        const res = await listResults(organizationModel, ENTITY, filters, projection, paging, ordering, {references: populate});
        return res;
    };



    module.exports.delete = async (id) => {
    try {
        validateId(id);
        const data = prepareDelete(ENTITY);
        const filters = {...data.filters, _id: id};
        const result = await organizationModel.findByIdAndDelete(filters);
        if (!result) {
            const err = new Error("Δεν έχετε άδεια να διαγράψετε αυτόν τον οργανισμό.");
            err.code = 4000;
            throw err;
        }
        return  result;
    } catch (error) {
        throw error;
    }
};


module.exports.getAllOrg = async () => {
    try {
        const final = await organizationModel.find({organizationType: "municipality"})
        return final;
    } catch (error) {
        throw error;
    }
};

module.exports.createPartner = async (data) => {
    try {
        const result = await  prepareCreate(ENTITY2, data);
        const code = result.data.organizationVat;
       const partner =  await partnerModel.findById( data.partnerType);
        result.data.partnerType = {
            _id: partner._id.toString(),
            type: partner.type
        };
        let organization = await organizationModel.findOne({organizationVat: code});
        if (organization) {
            const error = new Error("Το ΑΦΜ αυτό έχει ήδη χρησιμοποιηθεί για άλλο συνεργάτη.")
            error.code = 4000;
            throw error;
        }
        console.log(result.data)
        const final_data = {...result.data, organizationType: "partner"};
        organizationPartnerValidate(final_data);
       return await organizationModel.create(final_data);
    } catch (error) {
        throw error;
    }
};

module.exports.updatePartner = async (id, data, embedded) => {
    try {
        validateId(id);
        const result = await prepareUpdate(ENTITY2, data);
        result.data = await makeEmbeddedFields( embedded,result.data);
        organizationPartnerValidate(result.data);
        const filters = {...result.filters, _id: id};
        const final = await organizationModel.findOneAndUpdate(filters, {$set: result.data})
        if (!final) {
            const err = new Error("Δεν έχετε άδεια να αλλάξετε αυτό  τον συνεργάτη..");
            err.code = 4000;
            throw err;
        }
        return final;
    } catch (error) {
        throw error;
    }
};
module.exports.findByIdAndUpdate_ = async (id, data) => {
    try {
        validateId(id);
        organizationPartnerValidate(data);
        const filters = {_id: id};
        const final = await organizationModel.findOneAndUpdate(filters, {$set: data})
        if (!final) {
            const err = new Error("Δεν έχετε άδεια να αλλάξετε αυτό  τον συνεργάτη..");
            err.code = 4000;
            throw err;
        }
        return final;
    } catch (error) {
        throw error;
    }
};
module.exports.findByIdAndDelete = async (id) => {
    try {
        validateId(id);
        const filters = {_id: id};
        const final = await organizationModel.findOneAndDelete(filters);
        return final;
    } catch (error) {
        throw error;
    }
};
//
//module.exports.findByIdPartner = async (id) => {
//  validateId(id);
//  //prepareRetrieve(ENTITY);
//  return await organizationModel.findById(id);
//};

module.exports.findPartner = async (
        filters,
        projection,
        paging,
        ordering,
        populate,
        ) => {

    filters['organizationType'] = {'$eq': 'partner'};
    const res = await listResults(organizationModel, ENTITY, filters, projection, paging, ordering, {references: populate});
    return res;
};

module.exports.deletePartner = async (id) => {
    try {
        validateId(id);
        const data = prepareDelete(ENTITY2);
        const filters = {...data.filters, _id: id};
        const result = await organizationModel.findByIdAndDelete(filters);
        if (!result) {
            const err = new Error("Δεν έχετε άδεια να διαγράψετε αυτόν τον συνεργάτη.");
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
        { key: "organizationName", label: "Όνομα Δήμου" },
        { key: "organizationStatus", label: "Κατάσταση Δήμου" },
        { key: "organizationCode", label: "Κωδικός Δήμου" },
        { key: "organizationStreet", label: "Οδός Δήμου" },
        { key: "organizationStreetNo", label: "Αριθμός Οδού Δήμου" },
        { key: "organizationZipCode", label: "ΤΚ Δήμου" },
        { key: "organization.organizationName", label: "Γονικός Δήμος" },
        { key: "colorsRef", label: "Χρώματα" },
        { key: "createdBy.username", label: "Δημιουργήθηκε από" },
        { key: "updatedBy.username", label: "Ενημερώθηκε από" },
        { key: "createdAt", label: "Ημερομηνία Δημιουργίας" },
        { key: "updatedAt", label: "Ημερομηνία Ενημέρωσης" }
    ];

    const populate = {};
    const projection = null;
    const config = { references: populate };

    // First, count total records
    const totalCount = await organizationModel.countDocuments(filters);

    // If <= 5000 → simple Excel
    if (totalCount <= 5000) {

      const paging = { skip: 0, limit: totalCount };
      const result = await listResults(organizationModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Δήμοι");

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
      const result = await listResults(organizationModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      if (!data.length) break;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Δήμοι ${batch}`);
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

module.exports.exportPartnersToExcel = async (filters, ordering) => {
  try {
    const excelFieldMap = [
        { key: "organizationName", label: "Όνομα Συνεργάτη" },
        { key: "partnerType.type", label: "Τύπος Συνεργάτη" },
        { key: "organizationVat", label: "ΑΦΜ Συνεργάτη" },
        { key: "organizationMunicipality", label: "ΔΟΥ Συνεργάτη" },
        { key: "organizationContact", label: "Επικοινωνία Συνεργάτη" },
        { key: "organizationStreet", label: "Οδός Συνεργάτη" },
        { key: "organizationStreetNo", label: "Αριθμός Οδού Συνεργάτη" },
        { key: "organization.organizationName", label: "Δήμος Συνεργάτη" },
        { key: "organizationZipCode", label: "ΤΚ Συνεργάτη" },
        { key: "organizationSiteURL", label: "Ιστότοπος Συνεργάτη" },
        { key: "organizationLogo", label: "Λογότυπο Συνεργάτη" },
        { key: "createdBy.username", label: "Δημιουργήθηκε από" },
        { key: "updatedBy.username", label: "Ενημερώθηκε από" },
        { key: "createdAt", label: "Ημερομηνία Δημιουργίας" },
        { key: "updatedAt", label: "Ημερομηνία Ενημέρωσης" }
    ];

    const populate = {};
    const projection = null;
    const config = { references: populate };
    filters = {
                ...filters,
                organizationType: { $eq: "partner" }
            };

    // First, count total records
    const totalCount = await organizationModel.countDocuments(filters);

    // If <= 5000 → simple Excel
    if (totalCount <= 5000) {

      const paging = { skip: 0, limit: totalCount };
      const result = await listResults(organizationModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Συνεργάτες");

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
      const result = await listResults(organizationModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      if (!data.length) break;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Συνεργάτες ${batch}`);
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
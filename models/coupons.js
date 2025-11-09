const {prepareCreate,prepareUpdate,prepareRetrieve,prepareDelete,getSessionData} = require("../lib/sessionstorage");
const ENTITY = require("./entities").COUPONS;
const { listResults } = require("../lib/results");
const validateId = require("../lib/validateId");
const couponClaimsModel = require("../models/couponClaims");
const {User} = require("../models/schemas/users");
const {organizationModel} = require("./schemas/organizations");
const getCoOwners = require("../lib/getCoOwners");
const {couponsModel , couponsValidation}= require("./schemas/coupons");
const { offerTypesModel } = require("./schemas/offerTypes");
const {makeEmbeddedFields} = require("../lib/makeEmbeddedFields");
const mongoose = require("mongoose");
const getNestedField = require("../lib/getNestedField");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");

function enforceOfferTypeRules(payload, offerTypeDoc) {
    if (!offerTypeDoc) throw new Error("Μη έγκυρος τύπος προσφοράς (offer_type).");

    const required = Array.isArray(offerTypeDoc.requiredFields) ? offerTypeDoc.requiredFields : [];

    const missing = required.filter((f) => {
        const v = payload[f];
        return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    });

    if (missing.length) {
        // fieldLabels may be a Map (mongoose) or plain object; normalize it
        const labelsSource = offerTypeDoc.fieldLabels instanceof Map
            ? Object.fromEntries(offerTypeDoc.fieldLabels)
            : (offerTypeDoc.fieldLabels || {});

        const missingLabels = missing.map((k) => labelsSource[k] || k);

        const err = new Error(`Λείπουν υποχρεωτικά πεδία για τον τύπο "${offerTypeDoc.type}": ${missingLabels.join(', ')}`);

        // optional details for the client/UI
        //err.details = { missingFields: missing, missingFieldLabels: missingLabels };
        throw err;
    }
}

const { findWithFilters } = require('../utils/findWithFilters');
const c = require("config");

module.exports.create = async (data, embedded) => {
        
    // enforce offer type rules
    const ot = await offerTypesModel.findById(data.offer_type).lean();
    enforceOfferTypeRules(data, ot);

    // get session data
    const result = await prepareCreate(ENTITY, data);

    if (!result.data) throw new Error("Problem preparing data");
        
    
    // check if partner id is valid and is of type 'partner'
    if (result.data.partner) {
        const orgFilters = {
            _id: result.data.partner,
            organizationType: { $eq: 'partner' }
        };
        const partners = await organizationModel
        .find(orgFilters)
        .select('_id organizationName') // projection
        .limit(1)
        .lean();

        const partner = partners[0];
        if (!partner) throw new Error("Invalid partner ID or not a partner organization");
        // change organization to that of the partner
        result.data.organization = { _id: partner._id.toString(), organizationName: partner.organizationName };
    }

    // set coOwners to owner of the partner organization
    const userFilters = {
        'organization._id': result.data.organization
    };
    const owners = await User
    .find(userFilters)
    .select('_id username')
    .lean();
    if (owners.length) {
        result.data.coOwners = owners.map(o => ({
            ...o,
            _id: String(o._id),
        }));
    } else {
        result.data.coOwners = [];
    }
    
    // embed referenced fields
    result.data = await makeEmbeddedFields(embedded, result.data);
    
    couponsValidation(result.data);
    
    return await couponsModel.create(result.data);
};

module.exports.update = async (id, data, embedded) => {
    validateId(id);
    data.coOwners = await getCoOwners(id,couponsModel);
    // get session data
    const result = await prepareUpdate(ENTITY, data);
    if (!result.data) throw new Error("Problem preparing data");
    
    // check if partner id is valid and is of type 'partner'
    if (result.data.partner) {
        const orgFilters = {
            _id: result.data.partner,
            organizationType: { $eq: 'partner' }
        };
        const partners = await organizationModel
        .find(orgFilters)
        .select('_id organizationName') // projection
        .limit(1)
        .lean();
        const partnerExists = partners[0];
        if (!partnerExists) throw new Error("Invalid partner ID or not a partner organization");
        result.data.organization = { _id: partnerExists._id.toString(), organizationName: partnerExists.organizationName };
    }
    
    // embed referenced fields
    result.data = await makeEmbeddedFields(embedded, result.data);
    
    couponsValidation(result.data);

    const filters = { ...result.filters, _id: id };
    return await couponsModel.findOneAndUpdate(filters, { $set: result.data }, { new: true });
};

module.exports.find = async (filters, projection, paging, ordering, populate) => {
//    const res = await listResults(couponsModel, ENTITY, filters, projection, paging, populate, ordering);
//    const res = await findWithFilters(couponsModel, filters, options = {}, {
//       references: {
//           organization: {ref: "Organization", as : "org"} 
//       }
//    });

//    console.log(JSON.stringify(ordering, null, 2));
//    return res;

    if (filters.hasOwnProperty('organization.organizationName' )) {
        filters['organization.organizationType'] = {'$eq': 'municipality'};
    }

    // we dont want to send back with the org (references property) populated
    
//    console.log(JSON.stringify(paging, null, 2));
//    console.log(JSON.stringify(filters, null, 2));
//    console.log(JSON.stringify(projection, null, 2));
//      console.log(JSON.stringify(populate, null, 2));
    // added the last argument with the configuration on refrenced fileds
    const res =  await listResults(couponsModel, ENTITY, filters, {projection: projection}, paging, ordering, {references: populate});

    return res;
};

module.exports.mobileFind = async (filters, projection, paging, ordering, populate) => {
    if (filters.hasOwnProperty('organization.organizationName' )) {
        filters['organization.organizationType'] = {'$eq': 'municipality'};
    }
    const res =  await listResults(couponsModel, ENTITY, filters, {projection: projection}, paging, ordering, {references: populate, forceAggregate: true});
    return res;
};

module.exports.delete = async (id) => {
    validateId(id);

    // Find all claims for this coupon
    const claims = await couponClaimsModel.findAll({ coupon: id });
    //console.log("claims:", claims);
    if (claims.count > 0) {
        //const hasRedeemed = claims.results.some(claim => claim.redeemed === true);
        //console.log("hasRedeemed:", hasRedeemed);
        throw new Error("Cannot delete coupon with claims.");
        /*if (hasRedeemed) {
            throw new Error("Cannot delete coupon with redeemed claims.");
        }*/
    }

    const result = prepareDelete(ENTITY);
    const filters = { ...result.filters, _id: id };
    return await couponsModel.findOneAndDelete(filters);
};

module.exports.exportToExcel = async (filters, ordering) => {
  try {
    const excelFieldMap = [
        { key: "name", label: "Όνομα Κουπονιού" },
        { key: "partner.organizationName", label: "Συνεργάτης" },
        { key: "start_date", label: "Ημερομηνία Έναρξης" },
        { key: "end_date", label: "Ημερομηνία Λήξης" },
        { key: "offer_type.type", label: "Τύπος Προσφοράς" },
        { key: "isActive", label: "Ενεργό" },
        { key: "unit_price", label: "Τιμή Μονάδας" },
        { key: "coupon_value", label: "Αξία Κουπονιού" },
        { key: "details", label: "Λεπτομέρειες" },
        { key: "discount_percentage", label: "Ποσοστό Έκπτωσης" },
        { key: "get_x", label: "Παίρνεις (Get X)" },
        { key: "min_purchase", label: "Ελάχιστη Αγορά" },
        { key: "pay_x", label: "Πληρώνεις (Pay X)" },
        { key: "points_value", label: "Αξία Πόντων" },
        { key: "terms_conditions", label: "Όροι & Προυποθέσεις" },
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
    const totalCount = await couponsModel.countDocuments(filters);

    // If <= 5000 → simple Excel
    if (totalCount <= 5000) {

      const paging = { skip: 0, limit: totalCount };
      const result = await listResults(couponsModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Κουπόνια");

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
      const result = await listResults(couponsModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      if (!data.length) break;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Κουπόνια ${batch}`);
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
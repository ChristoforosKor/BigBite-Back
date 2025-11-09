const {prepareCreate,prepareUpdate,prepareRetrieve,prepareDelete,getSessionData} = require("../lib/sessionstorage");
const ENTITY = require("./entities").COUPONCLAIMS;
const { listResults } = require("../lib/results");
const validateId = require("../lib/validateId");
const uniqid = require("uniqid");
var QRCode = require("qrcode");
const couponsModel = require("./coupons");
const getCoOwners = require("../lib/getCoOwners");
const User = require("./users");
const {couponClaimsModel , couponClaimsValidation}= require("./schemas/couponClaims");
const {makeEmbeddedFields} = require("../lib/makeEmbeddedFields");
const getNestedField = require("../lib/getNestedField");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");


module.exports.create = async (data, embedded) => {
    
    const couponExists = await couponsModel.find({ _id: data.coupon });
    if (couponExists.count==0) {
        throw new Error("Invalid coupon ID: Coupon does not exist.");
    }

    const userExists = await User.find({ _id: data.user });
    if (userExists.count==0) {
        throw new Error("Invalid user ID: User does not exist.");
    }
    const code = uniqid.time();
    const qr_svg = await QRCode.toString(code, { type: 'svg' });

    const preparedData = {
        coupon_code: code,
        qr_code_svg: qr_svg,
        ...data,
    };
    const result = await prepareCreate(ENTITY, preparedData);
    
    result.data = await makeEmbeddedFields(embedded,result.data);
    
    couponClaimsValidation(result.data);
    return await couponClaimsModel.create(result.data);
};

module.exports.produce = async (id, data, embedded) => {
    validateId(id);
    data.coupon = id;
    const couponExists = await couponsModel.find({ _id: data.coupon });
    if (couponExists.count==0) {
        throw new Error("Invalid coupon ID: Coupon does not exist.");
    }
    const result = await prepareCreate(ENTITY, data);
    result.data.user = result.data.createdBy;
    const code = uniqid.time();
    const qr_svg = await QRCode.toString(code, { type: 'svg' });

    const preparedData = {
        coupon_code: code,
        qr_code_svg: qr_svg,
        ...result.data,
    };
    result.data = await makeEmbeddedFields(embedded,preparedData);

    couponClaimsValidation(result.data);

    return await couponClaimsModel.create(result.data);
};

module.exports.redeem = async (id, data, embedded) => {
    validateId(id);
    let couponClaimExists=false;
    
    if (id) {
        couponClaimExists = await couponClaimsModel.findOne({ coupon_code: id });
        if (!couponClaimExists) throw new Error("Invalid coupon code");
    }
    
    data.coupon=couponClaimExists.coupon.toString();
    data.coOwners = await getCoOwners(id, couponClaimsModel);
    const result = await prepareUpdate(ENTITY, data);
    result.data = await makeEmbeddedFields(embedded,result.data);
    couponClaimsValidation(result.data);

    const filters = { ...result.filters, coupon_code: id };
    return await couponClaimsModel.findOneAndUpdate(filters, { $set: result.data }, { new: true });
};

module.exports.update = async (id, data, embedded) => {
    validateId(id);
    data.coOwners = await getCoOwners(id,couponClaimsModel);

    const result = await prepareUpdate(ENTITY, data);

    result.data = await makeEmbeddedFields(embedded,result.data);

    couponClaimsValidation(result.data);
 
    const filters = { ...result.filters, _id: id };
    return await couponClaimsModel.findOneAndUpdate(filters, { $set: result.data }, { new: true });
};

module.exports.find = async (filters, projection, paging, ordering, populate) => {
    const sessionData = getSessionData();
    const theuser = sessionData; //user.organization
    const userExists = await User.findById(theuser.session.user._id);
    const user = userExists;
    const targetRoleId = '688736206e24e99ee2c9657c';
    //console.log('userExists:', userExists);
    if (user?.roles?.some(roleId => roleId.toString() === targetRoleId)) {
        const partnerID = user.organization.toString();
        const coupons = await couponsModel.find({partner: partnerID}, '_id');
        const couponIds = coupons.results.map(c => c._id.toString());
        //console.log('couponIds:', couponIds);
        const thefilters = {
            ...filters,
            coupon: {$in: couponIds}
        };
        return await listResults(couponClaimsModel, ENTITY, thefilters, projection, paging, populate, ordering, true);
    }
    if (filters.hasOwnProperty('organization.organizationName')) {
        filters['organization.organizationType'] = {'$eq': 'municipality'};
    }

    const res = await listResults(couponClaimsModel, ENTITY, filters, projection, paging, ordering, {references: populate});
    return res;
};

module.exports.mobileFind = async (filters, projection, paging, ordering, populate) => {
    if (filters.hasOwnProperty('organization.organizationName' )) {
        filters['organization.organizationType'] = {'$eq': 'municipality'};
    }
    const res =  await listResults(couponClaimsModel, ENTITY, filters, {projection: projection}, paging, ordering, {references: populate, forceAggregate: true});
    return res;
};

module.exports.findAll = async (filters, projection, paging, ordering, populate) => {
    return await listResults(couponClaimsModel, ENTITY, filters, projection, paging, populate, ordering, true);
};

module.exports.findById = async (id) => {
    try{
        validateId(id);
        const { filters } = prepareRetrieve(ENTITY);
        filters._id = id;
        return await couponClaimsModel.find(filters).populate([
            { path: 'user' },
            { path: 'createdBy', select: 'username' },
            { path: 'updatedBy', select: 'username' },
            { path: 'organization' }
        ]);
    } catch (error) {
        throw  error;
    }
};

module.exports.delete = async (id) => {
    validateId(id);

    // Find the specific claim by ID
    const claim = await couponClaimsModel.findById(id);
    if (!claim) {
        throw new Error("Coupon claim not found.");
    }

    // Check if it is redeemed
    if (claim.redeemed) {
        throw new Error("Cannot delete a coupon claim that has been redeemed.");
    }

    const result = prepareDelete(ENTITY);
    const filters = { ...result.filters, _id: id };
    return await couponClaimsModel.findOneAndDelete(filters);
};

module.exports.exportToExcel = async (filters, ordering) => {
  try {
    const excelFieldMap = [
        { key: "user.username", label: "Όνομα Χρήστη" },
        { key: "redeemed", label: "Εξαργυρώθηκε" },
        { key: "coupon.name", label: "Κουπόνι" },
        { key: "coupon_code", label: "Κωδικός Κουπονιού" },
        { key: "group_code", label: "Ομαδικός Κωδικός" },
        { key: "qr_code_svg", label: "QR Κωδικός" },
        { key: "createdBy.username", label: "Δημιουργήθηκε από" },
        { key: "updatedBy.username", label: "Ενημερώθηκε από" },
        { key: "createdAt", label: "Ημερομηνία Δημιουργίας" },
        { key: "updatedAt", label: "Ημερομηνία Ενημέρωσης" }
    ];

    const populate = {};
    const projection = null;
    const config = { references: populate };

    // First, count total records
    const totalCount = await couponClaimsModel.countDocuments(filters);

    // If <= 5000 → simple Excel
    if (totalCount <= 5000) {

      const paging = { skip: 0, limit: totalCount };
      const result = await listResults(couponClaimsModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Κατοχύρωση Κουπονιών");

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
      const result = await listResults(couponClaimsModel, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      if (!data.length) break;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Κατοχύρωση Κουπονιών ${batch}`);
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
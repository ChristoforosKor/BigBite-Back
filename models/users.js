const {
    prepareCreate,
    prepareUpdate,
    prepareRetrieve,
    prepareDelete,
} = require("../lib/sessionstorage");
const {User, validate} = require('./schemas/users');
const {organizationModel, organizationValidate} = require('./schemas/organizations');
const {Weight} = require("./schemas/weights");
const sessionModel = require('./sessions');
const validateId = require('../lib/validateId');
const getCoOwners = require('../lib/getCoOwners');
const uniqid = require("uniqid");
const mongoose = require("mongoose");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const ENTITY = require("./entities").USERS;
const {listResults} = require("../lib/results");
const config = require('config');
const nodemailer = require('nodemailer');
const getNestedField = require("../lib/getNestedField");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");
const jwt = require('jsonwebtoken');
const {
    setSessionData,
    flattenPermissions,
    anonymousSessionData,
    getSessionData
} = require("../lib/sessionstorage");
const CodeError = require("../lib/errors/CodeError");
const { findWithFilters } = require('../utils/findWithFilters');

const sendMail = require('../lib/sendMail');
const {couponsModel} = require("./schemas/coupons");
const {roleModel} = require("./schemas/roles");
const {makeEmbeddedFields} = require("../lib/makeEmbeddedFields");
const {couponClaimsModel , couponClaimsValidation}= require("./schemas/couponClaims");



//module.exports.findById = async (id, projection, populate) => {
//    validateId(id);
//    const user = await userModel.findById(id).select("-password");
//    return user;
//};

//const emailTransporter = nodemailer.createTransport({
//    service: 'gmail',
//    auth: {
//        user: config.get("email"),
//        pass: config.get("password")
//    }
//});
const findRoles = async(roles) => {
    const res = await roleModel.find({_id: {$in: roles}}).select('_id role');
    const rolesSelected = res.map(r => ({_id: r._id.toString(), role: r.role}));

   return rolesSelected
}
module.exports.findMe = async () => {
    try {
        const sessionData = sessionModel.clientSession();
        const userId = sessionData ? sessionData.user_id : null;
        const token = sessionData ? sessionData.token : null;
        if (!token)
            throw new CodeError("Unauthorized", 40100);
        const user = await User.findById(userId).select("-password")
        return {user, sessionData};
    } catch (error) {
        throw error;
    }
};

module.exports.findById = async (id, projection, populate) => {
    try {
        validateId(id);
        const res =  await prepareRetrieve(ENTITY);
        const user = await User.findById(id).select("-password");
          if (!user) {
                       throw new Error("Αυτός ο χρήστης δεν υπάρχει");
        }
        const weightStats = await Weight.aggregate([
        {
            $match: {
            $or: [
                { "createdBy._id": user._id },
                { "coOwners._id": user._id }
            ]
            }
        },
        {
            $group: {
            _id: null,
            totalWeight: { $sum: "$weight" },
            count: { $count: {} }
            }
        }
        ]);
        const coupons =  await couponClaimsModel.countDocuments({"user._id": id})
        const organization = await organizationModel.findOne({_id: user.organization._id});
        const parts = user.fullname.split(" ");
           const firstName = parts[0];
         const lastName = parts[1];  
        const image = user.image || null;        
         const power = user.power_supply_number|| null;  
         //console.log('user-weights:',weightStats);
      return {
            id: user._id,
            firstName,
            lastName,
            image: user.image || null,
            gender: user.gender,
            email: user.username,
            yearOfBirth: user.birth_year,
            mobile: user.mobile_phone,
            address: {
                street: user.street,
                number: user.streetNo,
                municipality: organization,
                zip: user.zipCode,
            },
            arithmosParoxis: user.power_supply_number || null,
            familyMembers: user.household_members,
            discounts: user.discounts,
            newsletter: user.newsletter,
            coupons: coupons,
            weights: {
                total: weightStats[0]?.totalWeight || 0,
                count: weightStats[0]?.count || 0
            }
        };

    } catch (error) {
        throw error;
    }
};


module.exports.find = async (filters, projection, paging, ordering, populate) => {
    const res =  await listResults(User, ENTITY, filters, projection, paging, ordering, {references: populate});
    return res;

};

module.exports.create = async (data) => {
    try {
        data =  await prepareCreate(ENTITY, data);
       data = data.data;
        let user = await User.findOne({username: data.username});
        if (user) {
            const err = new Error("Το όνομα χρήστη υπάρχει ήδη.");
            err.code = 4000;
            throw err;
        }
        const {error} = validate(data);
        if (error)
            throw new Error(error.details[0].message);
        user = new User(_.pick(data, [
            "password",
            "roles",
            "household_members",
            "birth_year",
            "streetNo",
            "zipCode",
            "street",
            "municipality",
            "mobile_phone",
            "fullname",
            "username",
            "organization"
        ]));

        const organization = await organizationModel.findOne({_id: user.organization}).populate('colors');
        let qr_codes = [];
        const uniq_id = uniqid.time();
        let uniq = await User.findOne({uniqid: uniq_id.toUpperCase()});
        if (uniq) {
            const err = new Error("Δοκιμάστε ξανά");
            err.code = 4000;
            throw err;
        }
        user.uniqid = uniq_id.toUpperCase();
        for (const color of organization.colors) {
            const qr = organization.organizationCode + color.code_number + 0 + uniq_id.toUpperCase();
            qr_codes.push(qr);

        }
        const sessionData = sessionModel.clientSession();
        const userId = sessionData ? sessionData.user_id : null;
        user.createdBy = userId;
        user.qr_codes = qr_codes;
        user.isConfirmed = true;
        user.coOwners = [];
        user.coOwners.push({ _id: user._id.toString(), username: user.username });
        user.roles = await findRoles(data.roles);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();
        return user;
    } catch (error) {
        throw error;
    }
};



module.exports.register = async (values) => {
//    try {


    let data = await prepareCreate(ENTITY, values);
    data = data.data;
    delete data.createdBy;
   const staged = {...data};
    delete staged.passwordAgain;
    const confirmedMail = values.confirmedMail;
    delete staged.confirmedMail;
    
   const {error} = validate(staged);
//        
//        if (error) { //@TODO let the error propagate
//           
//            error.code = 40000;
//            throw new Error(error.details[0].message);
//        }
    let user = await User.findOne({username: data.username});
    if (user) {
        const err = new Error("Το όνομα χρήστη υπάρχει ήδη.");
        err.code = 4000;
        throw err;
    }
    if (data.password !== data.passwordAgain) {
        const err = new Error("Οι κωδικοί δεν ταυτίζονται");
        err.code = 4000;
        throw err;
    }

    user = new User(_.pick(data, [
        "password",
        "roles",
        "household_members",
        "birth_year",
        "streetNo",
        "zipCode",
        "street",
        "municipality",
        "mobile_phone",
        "fullname",
        "username",
        "organization",
        "power_supply_number"
    ]));

    const organization = await organizationModel.findById(user.organization._id).populate('colors');
    let qr_codes = [];
    const uniq_id = uniqid.time();
    let uniq = await User.findOne({uniqid: uniq_id.toUpperCase()});
    if (uniq) {
        const err = new Error("Δοκιμάστε ξανά");
        err.code = 4000;
        throw err;
    }
    user.uniqid = uniq_id.toUpperCase();
    for (const color of organization.colors) {
        const qr = organization.organizationCode + color.code_number + 0 + uniq_id.toUpperCase();
        qr_codes.push(qr);

    }
    user.createdBy = user._id;
    user.qr_codes = qr_codes;
    user.roles = [config.get("CIVILROLE")];
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    user.coOwners = [];
    user.coOwners.push({ _id: user._id.toString(), username: user.username });

//    απο sso ο χρήστης είναι απευθείας confirmed
    if (confirmedMail !== true) {
        const subject = 'Επιβεβαίωσε το email';
        const url = config.get('mail_password_url');
        const emailToken = jwt.sign({email: user.username}, config.get("secret"), {expiresIn: config.get("password_token_expiration")});
        const verificationUrl = `${url}/users/confirm?token=${emailToken}`;
        const  html = `Πατήστε στο λινκ για να επαληθεύσετε το email σας: <a href="${verificationUrl}">${verificationUrl}</a>`;
        sendMail(user.username, subject, html);
    } else {
        const subject = 'Η εγγραφή σας ολοκληρώθηκε';
        const  html = `Ο λογαριασμός σας στο <a href="recyclebin.mnss.eu">recyclebin.mnss.eu</a> έχει δημιουργηθεί με επιτυχία!`;
        user.isConfirmed = true;    
        sendMail(user.username, subject, html);
    }
    await user.save();
    return user;

};

module.exports.requestPassword = async (data) => {

    if (!data.hasOwnProperty('username')) {
        const err = new Error(`Change Password: Bad Request ${data}`);
        err.code = 40000;
        throw err;
    }
    let user = await User.findOne({username: data.username});
    if (!user) {
        const err = Error(`Change Password: ${data.username} Not Found`);
        err.code = 40400;
        throw err;
    }
    const url = config.get("front_url");   // θα αλλαξει οταν φτιαχτει το front
    const emailToken = jwt.sign({email: user.username}, config.get("secret"), {expiresIn: '6h'});
    const verificationUrl = `${url}/#/new-pass?token=${emailToken}`;
    const subject = 'Αλλαγή κωδικού';
    const html = `Πατήστε στο λινκ για να αλλάξετε κωδικό: <a href="${verificationUrl}">${verificationUrl}</a>`;

    await sendMail(user.username, subject, html);
};

module.exports.password = async (email, body) => {
    try {
        const {newPasswordAgain, newPassword} = body;

        if (newPassword !== newPasswordAgain) {
            const err = new Error("Οι κωδικοί δεν ταιριάζουν");
            err.code = 4000;
            throw err;
        }
        const user = await User.findOne({username: email});
        if (!user) {
            throw err;
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        return user;
    } catch (error) {
        throw error;

    }
};



module.exports.update = async (id, body, embedded) => {
    try {
//        body.coOwners = await getCoOwners(id,User);
        const data = await prepareUpdate(ENTITY, body);
         data.data = await makeEmbeddedFields( embedded,data.data);

        const user = await User.findOneAndUpdate(data.filters, data.data);
        if (!user) {
            const err = new Error("Δεν έχετε άδεια να αλλάξετε αυτόν τον χρήστη.");
            err.code = 4000;
            throw err;
        }
        return user;
    } catch (error) {
        throw   error;
    }
};

module.exports.delete = async (id) => {
    try {
        const data = prepareDelete(ENTITY);
        const user = await User.findById(id).select("-password");
        if (!user) {
            const err = new Error("Ο χρήστης δεν βρέθηκε");
            err.status = 404;
            throw err;
        }
        const filters = {...data.filters, _id: id};
        const result = await User.findOneAndDelete(filters);
        if (!result) {
            const err = new Error("Δεν έχετε άδεια να διαγράψετε αυτόν τον χρήστη.");
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
        { key: "uniqid", label: "Μοναδικό ID" },
        { key: "username", label: "Όνομα Χρήστη" },
        { key: "fullname", label: "Ονοματεπώνυμο" },
        { key: "mobile_phone", label: "Αριθμός Κινητού" },
        { key: "organization.organizationName", label: "Δήμος" },
        { key: "street", label: "Οδός" },
        { key: "zipCode", label: "Τ.Κ." },
        { key: "streetNo", label: "Αριθμός Οδού" },
        { key: "birth_year", label: "Έτος Γέννησης" },
        { key: "household_members", label: "Μέλη Νοικοκυριού" },
        { key: "qr_codes", label: "QR Κωδικοί" },
        { key: "rolesRef", label: "Ρόλοι Χρήστη" },
        { key: "createdBy.username", label: "Δημιουργήθηκε από" },
        { key: "updatedBy.username", label: "Ενημερώθηκε από" },
        { key: "createdAt", label: "Ημερομηνία Δημιουργίας" },
        { key: "updatedAt", label: "Ημερομηνία Ενημέρωσης" }
    ];

    const populate = {
            roles: {ref: "Role", as: "roles", fields: ["role"]}
        };
    const projection = null;
    const config = { references: populate };

    // First, count total records
    const totalCount = await User.countDocuments(filters);

    // If <= 5000 → simple Excel
    if (totalCount <= 5000) {

      const paging = { skip: 0, limit: totalCount };
      const result = await listResults(User, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];
      //console.log('Data length', data.length);
      //console.log('Data[0]', data[0]);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Χρήστες");

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
      const result = await listResults(User, ENTITY, filters, projection, paging, ordering, config);
      const data = result?.results || [];

      if (!data.length) break;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Χρήστες ${batch}`);
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
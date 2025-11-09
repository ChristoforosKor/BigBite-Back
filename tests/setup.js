require('jest-extended');
//const {MongoMemoryServer} = require('mongodb-memory-server');
//const {MongoClient, ObjectId} = require('mongodb');
//const initialRoles = [{
//        _id: new ObjectId("682c73f27010179fd2277037"),
//        role: "Super User",
//        permissions: [{
//                entity: "SU",
//                allowed: [
//                    0, 1, 2, 3, 4,
//                    5, 6, 7, 8, 9,
//                    10, 11, 12, 13, 14, 15],
//                denied: []
//            }]
//    }];
//
//const now = new Date();
//const adminId = new ObjectId("68662b3e4287339404f11c17");
//const mainSysId = new ObjectId('685517e093b7c7533a61b2f4');
//const initialUsers = [
//    {
//        _id: adminId,
//        username: "admin@mainsys.eu",
//        password: "$2b$10$4adMz4jS9LOv35r4JGvz4Olcg9SAo6jqYjqzVxWU2f8LV.kkde4WW", // 12345678
//        fullname: "Admin",
//        mobile_phone: "1234567890",
//        municipality: "Καματερό",
//        street: "Αιδινιού",
//        zipCode: "13469",
//        streetNo: "18 ",
//        birth_year: 1994,
//        household_members: "0",
//        qr_codes: [
//            "K2K2700MCN1HA3M",
//            "K2K2000MCN1HA3M"
//        ],
//        roles: [{
//                $oid: new ObjectId("682c73f27010179fd2277037")
//            }],
//        organization: new ObjectId('685517e093b7c7533a61b2f4'),
//        isConfirmed: true,
//        createdAt: now,
//        updatedAt: now,
//        createdBy: adminId,
//        updatedBy: adminId
//    }
//];
//const initialPartnerTypes = [
//    {
//        _id: new ObjectId('6853ceed0b254d8f34490158'),
//        type: "Φαγητό",
//        organization: null,
//        createdAt: now,
//        updatedAt: now,
//        createdBy: adminId,
//        updatedBy: adminId
//    },
//    {
//        _id: new ObjectId('686fa94739997447e09eed23'),
//        type: "Διασκέδαση",
//        organization: null,
//        createdAt: now,
//        updatedAt: now,
//        createdBy: adminId,
//        updatedBy: adminId
//    },
//    {
//        _id: new ObjectId('6891c402d6dc27eee58ca9d3'),
//        type: "Ομορφιά",
//        organization: null,
//        createdAt: now,
//        updatedAt: now,
//        createdBy: adminId,
//        updatedBy: adminId
//    },
//    {
//        _id: new ObjectId('6891c40ad6dc27eee58ca9ec'),
//        type: "Ένδυση",
//        organization: null,
//        createdAt: now,
//        updatedAt: now,
//        createdBy: adminId,
//        updatedBy: adminId
//    },
//    {
//        _id: new ObjectId('6891c413d6dc27eee58caa05'),
//        type: "Προϊόντα",
//        organization: null,
//        createdAt: now,
//        updatedAt: now,
//        createdBy: adminId,
//        updatedBy: adminId
//    },
//    {
//        _id: new ObjectId('6891c41ad6dc27eee58caa1e'),
//        type: "Υπηρεσίες",
//        organization: null,
//        createdAt: now,
//        updatedAt: now,
//        createdBy: adminId,
//        updatedBy: adminId
//    }
//];
//const initialColors = [{
//        _id: new ObjectId("68404f6f8acb2cc969bf00f7"),
//        color: "ΚΟΚΚΙΝΟ",
//        code_number: "80",
//        type: "ΠΛΑΣΤΙΚΟ",
//        createdAt: now,
//        updatedAt: now,
//        organization: null,
//        updatedBy: adminId,
//        createdBy: adminId
//    },
//    {
//        _id: new ObjectId("68404f898acb2cc969bf00f9"),
//        color: "ΚΙΤΡΙΝΟ",
//        code_number: "70",
//        type: "ΧΑΡΤΙ",
//        createdAt: now,
//        updatedAt: now,
//        organization: null,
//        updatedBy: adminId,
//        createdBy: adminId
//    },
//    {
//        _id: new ObjectId("68404f918acb2cc969bf00fb"),
//        color: "ΚΑΦΕ",
//        type: "ΟΡΓΑΝΙΚΟ",
//        code_number: "00",
//        createdAt: now,
//        updatedAt: now,
//        organization: null,
//        updatedBy: adminId,
//        createdBy: adminId
//    },
//    {
//        _id: new ObjectId("68404fa58acb2cc969bf00fd"),
//
//        color: "ΜΠΛΕ",
//        code_number: "90",
//        type: "PMD",
//        createdAt: now,
//        updatedAt: now,
//        organization: null,
//        updatedBy: adminId,
//        createdBy: adminId
//
//    }];
//
//const initialOrganizations = [{
//        _id: mainSysId,
//        organizationName: "MainSys",
//        colors: [],
//        organizationType: "partner",
//        partnerType: new ObjectId("6891c41ad6dc27eee58caa1e"),
//        organizationVat: "999239906",
//        organizationGecr: "006609101000",
//        organizationTaxOffice: "ΚΕΦΟΔΕ ΑΤΤΙΚΗΣ",
//        organizationContact: "ΓΩΓΩ ΦΑΡΜΑΚΗ",
//        organizationStreet: "ΑΪΔΙΝΙΟΥ",
//        organizationStreetNo: "18",
//        organizationMunicipality: "ΚΑΜΑΤΕΡΟ ΑΤΤΙΚΗΣ",
//        organizationZipCode: "13451",
//        organizationLogo: "https://recyclebin.mnss.eu/logos/1750407676842-279472595.png",
//        organizationSiteURL: "mainsys.eu",
//        organizationStatus: true,
//        createdBy: adminId,
//        updatedBy: adminId,
//        organization: null,
//        createdAt: now,
//        updatedAt: now
//    },
//    {
//        _id: new ObjectId("686cf7074d1f3469721da7f4"),
//        organizationName: "Δήμος Βάρης Βούλας Βουλιαγμένης",
//        colors: [
//            new ObjectId('68404f6f8acb2cc969bf00f7'),
//            new ObjectId("68404f898acb2cc969bf00f9"),
//            new ObjectId("68404f918acb2cc969bf00fb"),
//            new ObjectId("68404fa58acb2cc969bf00fd")
//        ],
//        organizationType: "municipality",
//        organizationCode: "Β123",
//        organizationStreet: "Αφροδίτης",
//        organizationStreetNo: "12",
//        organizationMunicipality: "Βουλιαγμένης",
//        organizationZipCode: 16671,
//        organizationStatus: true,
//        createdBy: adminId,
//        organization: mainSysId,
//        createdAt: now,
//        updatedAt: now,
//        updatedBy: adminId,
//        cratedBy: adminId
//
//    },
//    {
//        _id: new ObjectId("686629254287339404f11aa9"),
//        organizationName: "Δήμος Πειραιά",
//        colors: [
//            new ObjectId("68404f6f8acb2cc969bf00f7"),
//            new ObjectId("68404f898acb2cc969bf00f9"),
//            new ObjectId("68404f918acb2cc969bf00fb"),
//            new ObjectId("68404fa58acb2cc969bf00fd")
//        ],
//        organizationType: "municipality",
//        organizationCode: "ΠΕΙ1",
//        organizationStatus: true,
//        createdBy: adminId,
//        updatedBy: adminId,
//        organization: mainSysId,
//        organizationMunicipality: "Πειραιά",
//        organizationStreet: "Δραγάτση",
//        organizationStreetNo: 12,
//        organizationZipCode: 18510,
//        updatedAt: now,
//        createdAt: now
//    }];
//
//
//const init  = async () => {
//    const mongoServer = await MongoMemoryServer.create();
//    const mongoUri = mongoServer.getUri();
//    process.env.TEST_DB_URI = mongoUri;
//    const client = new MongoClient(mongoUri);
//    await client.connect();
//    const db = client.db();
//    await db.collection('users').insertMany(initialUsers);
//    await db.collection('colors').insertMany(initialColors);
//    await db.collection('organizations').insertMany(initialOrganizations);
//    await db.collection('partnertypes').insertMany(initialPartnerTypes);
//    global.__TEST_MONGO = {client, db, mongoServer};
//};
//
//module.exports = init;
module.exports = () => {};
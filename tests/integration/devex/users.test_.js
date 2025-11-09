const mongoose = require('mongoose');
const {MongoMemoryServer} = require('mongodb-memory-server');

const {User} = require('../../../models/schemas/users');
const DevexFilterToMongoose = require('../../../dto/DevexFilterToMongoose');

function u(s) {
    return s.toUpperCase('el');
}
;

async function seedUsers() {
    const docs = [{
            "_id": "689360c18ff348303c3c23f5",
            "username": "emilifashion@gmail.com",
            "password": "$2b$12$4ARtxlo00ABV4RUXbchn7eHL00PCEWUXv.a2qdRgHT4oah6mar4eC",
            "fullname": "ΕΥΑΓΓΕΛΙΑ ΒΙΤΣΑΡΑ",
            "mobile_phone": "1234567801",
            "municipality": "ΠΕΙΡΑΙΑΣ",
            "street": "Υψηλάντου",
            "zipCode": "18535",
            "streetNo": "150-154",
            "organization": "689360c18ff348303c3c23f4",
            "uniqid": "1F46EEE",
            "roles": ["688736206e24e99ee2c9657c"
            ],
            "isConfirmed": 1,
            "createdBy": "6846a89478e2acf13d707a6b",
            "createdAt": "2023-06-08T08:12:52.000Z",
            "coOwners": ["689360c18ff348303c3c23f5"]
        },
        {
            "_id": "689360d18ff348303c3c26ec",
            "username": "sarisrr@hotmail.com",
            "password": "$2b$12$sDOXBkOHaRbTLs82RqQFrOO4jdaCXwYvs4zFUojzq8B7dkqI0HnU6",
            "fullname": "Στυλιανος Σαριμπαλογλου",
            "mobile_phone": "1234567802",
            "municipality": "ΠΕΙΡΑΙΑΣ",
            "street": "Λεωφορος ζατζηκυριακου",
            "zipCode": "18538",
            "streetNo": "122",
            "organization": "689360d18ff348303c3c26eb",
            "uniqid": "2324C08",
            "roles": ["688736206e24e99ee2c9657c"],
            "isConfirmed": 1,
            "createdBy": "6846a89478e2acf13d707a6b",
            "createdAt": "2023-12-10T16:51:52.000Z",
            "coOwners": ["689360d18ff348303c3c26ec"]
        },
        {
            "_id": "689360d28ff348303c3c2702",
            "username": "ananiadisoe@gmail.com",
            "password": "$2b$12$i/yXfKFGhiY/BBYRByDqs.fv5y3DxKo3HWu8Uu10H1Pcu7nKkiHt6",
            "fullname": "ΣΤΑΥΡΟΣ ΑΝΑΝΙΑΔΗΣ",
            "mobile_phone": "1234567803",
            "municipality": "ΠΕΙΡΑΙΑΣ",
            "street": "Λεωφόρος Ειρήνης 11 & Γιαννοπούλου",
            "zipCode": "18547",
            "streetNo": "0",
            "organization": "689360d28ff348303c3c2701",
            "uniqid": "23511F5",
            "roles": ["688736206e24e99ee2c9657c"],
            "isConfirmed": 1,
            "createdBy": "6846a89478e2acf13d707a6b",
            "createdAt": "2023-06-26T06:25:45.000Z",
            "coOwners": ["689360d28ff348303c3c2702"]

        },

        {
            "_id": "685bd57893ab310f398819a7",
            "username": "rew@vvv.gr1",
            "password": "$2b$10$X0VIucnjfd1qXfdufYhoc.99LC1J96udkCgQ2O8QTc/LdjGl5ECpS",
            "fullname": "loulis loumpakis21",
            "mobile_phone": "1234567803",
            "municipality": "Βούλας Βάρης Βιουλαγμένης",
            "street": "μαραθωνος 1",
            "zipCode": "121311",
            "streetNo": "8α1",
            "birth_year": 20021,
            "household_members": "7+1",
            "qr_codes": [
                "AB11800MCBU80W3",
                "AB11700MCBU80W3",
                "AB11000MCBU80W3",
                "AB11900MCBU80W3"
            ],
            "roles": ["683037d677278f98e65612cd"],
            "organization": "685d3ed3b9dd9a6f58376e83",
            "uniqid": "MCBU80W3",
            "createdBy": "6846a89478e2acf13d707a6b",
            "createdAt": "2025-06-25T10:54:49.005Z",
            "updatedAt": "2025-07-04T09:31:31.691Z",
            "updatedBy": "6846a89478e2acf13d707a6b",
            "isConfirmed": true,
            "coOwners": ["685bd57893ab310f398819a7"]
        },
        {
            "_id": "688746d4daaf856433123cd6",
            "username": "testuservoulas@mail.com",
            "password": "$2b$10$bg.Aif9TdLY3h6n5C4moqu7sQXlMYnLoLAso5wOTpNowwHkUSTQrm",
            "fullname": "testuservoulas",
            "mobile_phone": "1234567804",
            "municipality": "Βούλας Βάρης Βιουλαγμένης",
            "street": "Αθήνας",
            "zipCode": "16671",
            "streetNo": "13",
            "birth_year": 1980,
            "household_members": "4",
            "qr_codes": [
                "Β123700MDMXAKEG",
                "Β123000MDMXAKEG",
                "Β123800MDMXAKEG",
                "Β123900MDMXAKEG"
            ],
            "roles": ["6895a6715ead6f616889a4aa"],
            "organization": "686cf7074d1f3469721da7f4",
            "uniqid": "MDMXAKEG",
            "createdBy": "6846a89478e2acf13d707a6b",
            "createdAt": "2025-07-28T09:45:56.804Z",
            "updatedAt": "2025-08-08T07:28:12.638Z",
            "updatedBy": "6846a89478e2acf13d707a6b",
            "isConfirmed": true,
            "coOwners": ["688746d4daaf856433123cd6"]
        },
        {
            "_id": "689360ca8ff348303c3c25bd",
            "username": "info@superstrada.gr",
            "password": "$2b$12$6GSG8o3zbGzCbtUVq5DBW...8X3/gaxEf276BGBIz3TJP6O0ZFQ3q",
            "fullname": "ΑΝΤΩΝΗΣ ΚΙΟΥΡΑΝΗΣ",
            "mobile_phone": "1234567806",
            "municipality": "Βούλας Βάρης Βιουλαγμένης",
            "street": "Αναπαύσεων",
            "zipCode": "16671",
            "streetNo": 18,
            "organization": "689360ca8ff348303c3c25bc",
            "uniqid": "2184F72",
            "roles": ["688736206e24e99ee2c9657c"],
            "isConfirmed": 1,
            "createdBy": "6846a89478e2acf13d707a6b",
            "createdAt": "2018-10-30T09:11:05.000Z",
            "coOwners": ["689360ca8ff348303c3c25bd"]
        }

    ];

    await User.insertMany(docs);
}
;


describe('DevexFilterToMongoose (integration with MongoDB', () => {
    let mongod;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri, {dbName: 'testdb'});
        await seedUsers();
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        await mongod.stop();
    });

    const build = (tokens) => new DevexFilterToMongoose().transform(tokens);

    it ('should return 6 records', async () => {
        const rows = await User.find({}).lean();
        expect(rows.length).toBe(6);
    });

//    test('equals on string (case-insensitive via uppercasing) -> username = "alexandros"', async () => {
//        const tokens = [['username', '=', 'alexandros']];
//        const query = build(tokens);
//        const rows = await User.find(query).lean();
//        expect(rows.map(r => r.username)).toEqual(['ALEXANDROS']);
//    });
//
//    test('startswith on fullname → "alexandros"', async () => {
//        const tokens = [['fullname', 'startswith', 'alex']];
//        const query = build(tokens);
//        const rows = await User.find(query).lean();
//        // ALEX PAPADOPOULOS and ALEXANDRA GEORGIOU
//        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U1', 'U2']));
//    });
//
//    test('contains on street → "odos"', async () => {
//        const tokens = [['street', 'contains', 'odos']];
//        const query = build(tokens);
//        const rows = await User.find(query).lean();
//        // U1 (ODOS ATTIKIS), U2 (ODOS THESSALONIKIS), U5 (ODOS ATHINAS)
//        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U1', 'U2', 'U5']));
//    });
//
//    test('in/anyof on zipCode', async () => {
//        const tokens = [['zipCode', 'in', ['12345', '33333']]];
//        const query = build(tokens);
//        const rows = await User.find(query).lean();
//        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U1', 'U5']));
//    });
//
//    test('notin/noneof on zipCode', async () => {
//        const tokens = [['zipCode', 'notin', ['12345', '33333']]];
//        const query = build(tokens);
//        const rows = await User.find(query).lean();
//        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U2', 'U3', 'U4']));
//    });
//
//    test('between (range) on birth_year [1980, 1988]', async () => {
//        const tokens = [['birth_year', 'between', ['1980', '1988']]];
//        const query = build(tokens);
//        const rows = await User.find(query).lean();
//        // years: 1980(U4), 1985(U1), 1988(U5) => 3 matches
//        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U1', 'U4', 'U5']));
//    });
//
//    test('isblank / isnotblank on power_supply_number', async () => {
//        const tokens = [
//            ['power_supply_number', 'isblank', null],
//            'or',
//            ['power_supply_number', 'isnotblank', null]
//        ];
//        const query = build(tokens);
//        const rows = await User.find(query).lean();
//        // everyone is either blank or not blank -> all docs
//        expect(rows).toHaveLength(5);
//    });
//
//    test('AND group: username = alex AND zipCode = 12345', async () => {
//        const tokens = [
//            ['username', '=', 'alexandros'],
//            'and',
//            ['zipCode', '=', '12345']
//        ];
//        const query = build(tokens);
//        const rows = await User.find(query).lean();
//        expect(rows.map(r => r.uniqid)).toEqual(['U1']);
//    });
//
//    test('OR of AND groups: (role by username prefix) OR (street contains "plateia")', async () => {
//        // Simulate “role by username prefix”: admin1/manager1 usernames
//        const tokens = [
//            [['username', 'startswith', 'admin'], 'and', ['isConfirmed', '=', 'true']],
//            'or',
//            [['street', 'contains', 'plateia'], 'and', ['isConfirmed', '=', 'true']]
//        ];
//        const query = build(tokens);
//        const rows = await User.find(query).lean();
//        // admin1 (U5, isConfirmed true) OR plateia syntagmatos (U4)
//        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U4', 'U5']));
//    });
//
//    test('no tokens → {} → returns all', async () => {
//        const query = build([]);
//        const rows = await User.find(query).lean();
//        expect(rows).toHaveLength(5);
//    });


});
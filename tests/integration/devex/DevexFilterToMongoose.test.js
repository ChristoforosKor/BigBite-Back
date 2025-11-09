const mongoose = require('mongoose');
const {MongoMemoryServer} = require('mongodb-memory-server');

const {User} = require('../../../models/schemas/users');
const DevexFilterToMongoose = require('../../../dto/DevexFilterToMongoose');

function u(s) {
    return s.toUpperCase('el')
}
;

async function seedUsers() {
    const docs = [
        {
            username: u('alexandros'),
            password: '1234567890', // min 5? use longer to satisfy your Joi; but we don't run Joi here
            fullname: u('alex papadopoulos'),
            mobile_phone: '2100000000',
            street: u('odos attikis'),
            zipCode: '12345',
            streetNo: '10',
            birth_year: 1985,
            power_supply_number: null,
            isConfirmed: true,
            uniqid: 'U1'
        },
        {
            username: u('alexandra'),
            password: '1234567890',
            fullname: u('alexandra georgiou'),
            mobile_phone: '2100000001',
            street: u('odos thessalonikis'),
            zipCode: '54321',
            streetNo: '11',
            birth_year: 1992,
            power_supply_number: '',
            isConfirmed: false,
            uniqid: 'U2'
        },
        {
            username: u('marios'),
            password: '1234567890',
            fullname: u('marios nikos'),
            mobile_phone: '2100000002',
            street: u('leoforos kifisias'),
            zipCode: '11111',
            streetNo: '12',
            birth_year: 1978,
            power_supply_number: 'PS123',
            isConfirmed: true,
            uniqid: 'U3'
        },
        {
            username: u('manager1'),
            password: '1234567890',
            fullname: u('manos manager'),
            mobile_phone: '2100000003',
            street: u('plateia syntagmatos'),
            zipCode: '22222',
            streetNo: '13',
            birth_year: 1980,
            power_supply_number: 'PS999',
            isConfirmed: true,
            uniqid: 'U4'
        },
        {
            username: u('admin1'),
            password: '1234567890',
            fullname: u('admin chief'),
            mobile_phone: '2100000004',
            street: u('odos athinas'),
            zipCode: '33333',
            streetNo: '14',
            birth_year: 1988,
            power_supply_number: 'PS777',
            isConfirmed: true,
            uniqid: 'U5'
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

    test('equals on string (case-insensitive via uppercasing) -> username = "alexandros"', async () => {
        const tokens = [['username', '=', 'alexandros']];
        const query = build(tokens);
        const rows = await User.find(query).lean();
        expect(rows.map(r => r.username)).toEqual(['ALEXANDROS']);
    });

    test('startswith on fullname → "alexandros"', async () => {
        const tokens = [['fullname', 'startswith', 'alex']];
        const query = build(tokens);
        const rows = await User.find(query).lean();
        // ALEX PAPADOPOULOS and ALEXANDRA GEORGIOU
        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U1', 'U2']));
    });

    test('contains on street → "odos"', async () => {
        const tokens = [['street', 'contains', 'odos']];
        const query = build(tokens);
        const rows = await User.find(query).lean();
        // U1 (ODOS ATTIKIS), U2 (ODOS THESSALONIKIS), U5 (ODOS ATHINAS)
        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U1', 'U2', 'U5']));
    });

    test('in/anyof on zipCode', async () => {
        const tokens = [['zipCode', 'in', ['12345', '33333']]];
        const query = build(tokens);
        const rows = await User.find(query).lean();
        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U1', 'U5']));
    });

    test('notin/noneof on zipCode', async () => {
        const tokens = [['zipCode', 'notin', ['12345', '33333']]];
        const query = build(tokens);
        const rows = await User.find(query).lean();
        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U2', 'U3', 'U4']));
    });

    test('between (range) on birth_year [1980, 1988]', async () => {
        const tokens = [['birth_year', 'between', ['1980', '1988']]];
        const query = build(tokens);
        const rows = await User.find(query).lean();
        // years: 1980(U4), 1985(U1), 1988(U5) => 3 matches
        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U1', 'U4', 'U5']));
    });

    test('isblank / isnotblank on power_supply_number', async () => {
        const tokens = [
            ['power_supply_number', 'isblank', null],
            'or',
            ['power_supply_number', 'isnotblank', null]
        ];
        const query = build(tokens);
        const rows = await User.find(query).lean();
        // everyone is either blank or not blank -> all docs
        expect(rows).toHaveLength(5);
    });

    test('AND group: username = alex AND zipCode = 12345', async () => {
        const tokens = [
            ['username', '=', 'alexandros'],
            'and',
            ['zipCode', '=', '12345']
        ];
        const query = build(tokens);
        const rows = await User.find(query).lean();
        expect(rows.map(r => r.uniqid)).toEqual(['U1']);
    });

    test('OR of AND groups: (role by username prefix) OR (street contains "plateia")', async () => {
        // Simulate “role by username prefix”: admin1/manager1 usernames
        const tokens = [
            [['username', 'startswith', 'admin'], 'and', ['isConfirmed', '=', 'true']],
            'or',
            [['street', 'contains', 'plateia'], 'and', ['isConfirmed', '=', 'true']]
        ];
        const query = build(tokens);
        const rows = await User.find(query).lean();
        // admin1 (U5, isConfirmed true) OR plateia syntagmatos (U4)
        expect(new Set(rows.map(r => r.uniqid))).toEqual(new Set(['U4', 'U5']));
    });

    test('no tokens → {} → returns all', async () => {
        const query = build([]);
        const rows = await User.find(query).lean();
        expect(rows).toHaveLength(5);
    });


});


//const request = require('supertest');
//const startServer = require('../../../main'); 
////const { connect, disconnect } = require('../../../startup/db');
//let server, agent, token;
//const prefix = '/api/v1/users';
//const testPort = 30001;


//
//beforeAll(async() => {
//    server = await startServer();
//    agent = request.agent(server);
//    const res = await agent
//           .post('/api/v1/auth/')
//           .send({username: 'admin2@mainsys.eu', password: '12345'});
//   token = res.get('x-recyclebin-jwtprivatekey');
//   
//});
//
//afterAll( () => {
//    new Promise(r => server.close(r));
//});
//
//describe('Test resuest filter to Devex', () => {
//    it('should return 200 for a valid request', async () => { 
//        const res = await agent.get(prefix + '/?requireTotalCount=true&searchOperation=contains&skip=0&take=20&filter[0][0]=username&filter[0][1]=contains&filter[0][2]=s.valis&filter[1]=and&filter[2][0]=fullname&filter[2][1]=contains&filter[2][2]=s&filter[3]=and&filter[4][0]=organization.organizationName&filter[4][1]=contains&filter[4][2]=sd');
//        
//////          .send({ username: 'nobody@nowhere.nw' });
////        ;
////                console.log(res);
//////        expect(res.status).toBe(200);
//            expect(true).toBe(true);
////
//      });
//});
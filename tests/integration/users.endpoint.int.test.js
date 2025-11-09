const mongoose = require('mongoose');
const { MongoMemoryServer } = require ('mongodb-memory-server');
const express = require('express');
const request = require('supertest');

const {User} = require('../../models/schemas/users');
const makeFilterNormalizer = require('../../factories/makeFilterNormalizer');
const DevexFilterToMongoose = require('../../dto/DevexFilterToMongoose');

const STRING_LOCALE = 'el';
const u = (s) => (typeof s === 'string' ? s.toLocaleUpperCase(STRING_LOCALE) : s);

async function seedUsers() {
  const docs = [
    {
      username: u('alexandros'),
      password: 'xxxxx',
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
      password: 'xxxxx',
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
      password: 'xxxxx',
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
      password: 'xxxxx',
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
      password: 'xxxxx',
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

function makeApp() {
  const app = express();

  // Use your query normalizer: tokens available at req.filters.raw
  app.use(makeFilterNormalizer({ sourceKey: 'filter', attachTo: 'filters', subKey: 'raw' }));

  // Endpoint that turns tokens → mongo → runs query
  app.get('/users', async (req, res, next) => {
    try {
      const tokens = req.filters?.raw ?? [];
      const builder = new DevexFilterToMongoose();
      const mongoQuery = builder.transform(tokens); // single Mongo filter object
      console.log(mongoQuery);
      const rows = await User.find(mongoQuery).lean();

      // For assertions we return uniqids alphabetically to avoid ordering flakiness
      const ids = rows.map(r => r.uniqid).sort();
      return res.json({ query: mongoQuery, ids, count: rows.length });
    } catch (e) {
       
      next(e);
    }
  });

  // minimal error handler to surface issues in test output
  app.use((err, _req, res, _next) => {
      res.status(500).json({ error: err.message, stack: err.stack });
  });

  return app;
}

// --- test suite ---------------------------------------------------

describe('GET /users (integration E2E with real DB)', () => {
  let mongod;
  let app;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: 'testdb' });
    await seedUsers();
    app = makeApp();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('qs filter: (username contains "alexandros") OR (username startswith "admin") → U1,U5', async () => {
    const res = await request(app)
      .get('/users')
      .query({
        // ["username","contains","alexandros"]
        'filter[0][0]': 'username',
        'filter[0][1]': 'contains',
        'filter[0][2]': 'alexandros',
        // "or"
        'filter[1]': 'or',
        // ["username","startswith","admin"]
        'filter[2][0]': 'username',
        'filter[2][1]': 'startswith',
        'filter[2][2]': 'admin'
      })
      .expect(200);

    expect(res.body.ids).toEqual(['U1', 'U5']);
    expect(res.body.count).toBe(2);
  });

  it('qs filter with array arg: zipCode in ["12345","33333"] → U1,U5', async () => {
    const res = await request(app)
      .get('/users')
      .query({
        // ["zipCode","in",["12345","33333"]]
        'filter[0][0]': 'zipCode',
        'filter[0][1]': 'in',
        'filter[0][2][0]': '12345',
        'filter[0][2][1]': '33333'
      })
      .expect(200);

    expect(new Set(res.body.ids)).toEqual(new Set(['U1', 'U5']));
    expect(res.body.count).toBe(2);
  });

  it('JSON string filter: ["birth_year","between",["1980","1988"]] → U1,U4,U5', async () => {
    const json = JSON.stringify([['birth_year', 'between', ['1980', '1988']]]);
    const res = await request(app)
      .get('/users')
      .query({ filter: json })
      .expect(200);

    expect(new Set(res.body.ids)).toEqual(new Set(['U1', 'U4', 'U5']));
    expect(res.body.count).toBe(3);
  });

  it('nested groups: ([username startswith admin] AND [isConfirmed=true]) OR [street contains plateia] → U4,U5', async () => {
    // [[ 'username','startswith','admin' ], 'and', [ 'isConfirmed','=','true' ]]  OR  [ 'street','contains','plateia' ]
    const res = await request(app)
      .get('/users')
      .query({
        // Left group (array index 0): [ ['username','startswith','admin'], 'and', ['isConfirmed','=','true'] ]
        'filter[0][0][0]': 'username',
        'filter[0][0][1]': 'startswith',
        'filter[0][0][2]': 'admin',

        'filter[0][1]': 'and',

        'filter[0][2][0]': 'isConfirmed',
        'filter[0][2][1]': '=',
        'filter[0][2][2]': 'true',

        // OR
        'filter[1]': 'or',

        // Right group (array index 2): [ 'street','contains','plateia' ]
        'filter[2][0]': 'street',
        'filter[2][1]': 'contains',
        'filter[2][2]': 'plateia'
      })
      .expect(200);

    expect(new Set(res.body.ids)).toEqual(new Set(['U4', 'U5']));
    expect(res.body.count).toBe(2);
  });
});
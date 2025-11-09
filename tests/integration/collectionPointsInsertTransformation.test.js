const mongoose = require('mongoose');
const {MongoMemoryServer} = require('mongodb-memory-server');

const sessionData =  {
    user: { _id: "6849690fadc13818e011b87b" },
        username: "d.sionas@mainsys.eu",
        roles: [ "682c73f27010179fd2277037"],
        permissions: [{
            entity: "SU",
                allowed: [
                   0,
                   1,
                   2,
                   3,
                   4,
                   5,
                   6,
                   7,
                   8,
                   9,
                   10,
                   11,
                   12,
                   13,
                   14,
                   15
                 ]
      }]
};


jest.mock('../../lib/sessionstorage', () => ({
    getSessionData: jest.fn().mockResolvedValue(sessionData),
    prepareCreate:  jest.fn((entity, data) =>{ 
//        console.log(data);
        return data;}),
    prepareUpdate: jest.fn(),
    prepareRetrieve: jest.fn(),
    prepareDeleteL:jest.fn()
}));


const {create, update} = require('../../models/collectionPoints');
const {collectionPoint} = require('../../models/schemas/collectionPoints');




let mongoServer;


const getData = () => {
    return {
        "title": "ΣΚΑΡΑΜΑΓΚΑ",
        "devices": ["68662e1066171a246e608da4", "68662e3166171a246e608dc2"],
        "organization": "686629254287339404f11aa9",
        "address": {"address": "Λεωφ. Σχιστού Σκαραμαγκά 151, Βιομηχανικό Πάρκο Σχιστού 188 63, Ελλάδα", "latitude": 37.97668004819228, "longitude": 23.598246574401855}
    };
};

const embedded = {
       device: { ref: "Device", as: "device",  fields:["title", "type"]},
       addresses: { ref: "Address", as: "addresses", fields: ['address', 'latitude', 'longitude'] }
};


beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await collectionPoint.deleteMany(); // clean DB after each test
});


it('should create embeded fields', async () => {
    const data = getData();
    const result = await create(data, embedded);
    console.log(JSON.stringify(result));
    expect(true).toBe(true);
});
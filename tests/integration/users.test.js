const request = require('supertest');
const app = require('../../app');
const {connect, disconnect} = require('../../startup/db');

let server;
const prefix = '/api/v1/users';
const testPort = 30001;

const getTestUser = () => {
    return {
        "username": "Test User",
        "password": "12344567890",
        "passwordAgain": "1234567890",
        "fullname": "loulis loumpakis",
        "mobile_phone": "6977011111",
        "municipality": "Βούλας Βάρης Βιουλαγμένης",
        "street": "μαραθωνος",
        "zipCode": "12131",
        "streetNo": "8α",
        "power_supply_number": "AO-23456789 001",
        "birth_year": 2002,
        "isConfirmed": false,
        "household_members": "7+",
        "roles": [
            "683037d677278f98e65612cd"
        ],
        "organization": "6840478e5f6181f5683c61eb"
    };
};


const getUsers = () => {
    return  [{
            _id: "685bd57893ab310f398819a7",
            username: "rew@vvv.gr1",
            password: "$2b$10$X0VIucnjfd1qXfdufYhoc.99LC1J96udkCgQ2O8QTc/LdjGl5ECpS",
            fullname: "loulis loumpakis21",
            mobile_phone: "6977011112",
            municipality: "Βούλας Βάρης Βιουλαγμένης1",
            street: "μαραθωνος1",
            zipCode: "121311",
            streetNo: "8α1",
            birth_year: 20021,
            "household_members": "7+1",
            "qr_codes": [
                'AB11800MCBU80W3',
                "AB11700MCBU80W3",
                "AB11000MCBU80W3",
                "AB11900MCBU80W3"
            ],
            "roles": [
                "683037d677278f98e65612cd"

            ],
            "organization": "685d3ed3b9dd9a6f58376e83",
            uniqid: "MCBU80W3",
            createdBy: "6846a89478e2acf13d707a6b",
            createdAt: "2025-06-25T10:54:49.005Z",
            updatedAt: "2025-07-04T09:31:31.691Z",
            updatedBy: "6846a89478e2acf13d707a6b",
            isConfirmed: true,
            coOwners: ["685bd57893ab310f398819a7"]
        },
        {
            _id: "685bd57893ab310f398819a7",
            username: "rew@vvv.gr1",
            password: "$2b$10$X0VIucnjfd1qXfdufYhoc.99LC1J96udkCgQ2O8QTc/LdjGl5ECpS",
            fullname: "loulis loumpakis21",
            mobile_phone: "6977011112",
            municipality: "Βούλας Βάρης Βιουλαγμένης1",
            street: "μαραθωνος1",
            zipCode: "121311",
            streetNo: "8α1",
            birth_year: 20021,
            "household_members": "7+1",
            "qr_codes": [
                'AB11800MCBU80W3',
                "AB11700MCBU80W3",
                "AB11000MCBU80W3",
                "AB11900MCBU80W3"
            ],
            "roles": [
                "683037d677278f98e65612cd"

            ],
            "organization": "685d3ed3b9dd9a6f58376e83",
            uniqid: "MCBU80W3",
            createdBy: "6846a89478e2acf13d707a6b",
            createdAt: "2025-06-25T10:54:49.005Z",
            updatedAt: "2025-07-04T09:31:31.691Z",
            updatedBy: "6846a89478e2acf13d707a6b",
            isConfirmed: true,
            coOwners: ["685bd57893ab310f398819a7"]
        },
        {
            _id: "685bd57893ab310f398819a7",
            username: "rew@vvv.gr1",
            password: "$2b$10$X0VIucnjfd1qXfdufYhoc.99LC1J96udkCgQ2O8QTc/LdjGl5ECpS",
            fullname: "loulis loumpakis21",
            mobile_phone: "6977011112",
            municipality: "Βούλας Βάρης Βιουλαγμένης1",
            street: "μαραθωνος1",
            zipCode: "121311",
            streetNo: "8α1",
            birth_year: 20021,
            "household_members": "7+1",
            "qr_codes": [
                'AB11800MCBU80W3',
                "AB11700MCBU80W3",
                "AB11000MCBU80W3",
                "AB11900MCBU80W3"
            ],
            "roles": [
                "683037d677278f98e65612cd"

            ],
            "organization": "685d3ed3b9dd9a6f58376e83",
            uniqid: "MCBU80W3",
            createdBy: "6846a89478e2acf13d707a6b",
            createdAt: "2025-06-25T10:54:49.005Z",
            updatedAt: "2025-07-04T09:31:31.691Z",
            updatedBy: "6846a89478e2acf13d707a6b",
            isConfirmed: true,
            coOwners: ["685bd57893ab310f398819a7"]
        },
         {
            _id: "685bd57893ab310f398819a7",
            username: "rew@vvv.gr1",
            password: "$2b$10$X0VIucnjfd1qXfdufYhoc.99LC1J96udkCgQ2O8QTc/LdjGl5ECpS",
            fullname: "loulis loumpakis21",
            mobile_phone: "6977011112",
            municipality: "Βούλας Βάρης Βιουλαγμένης1",
            street: "μαραθωνος1",
            zipCode: "121311",
            streetNo: "8α1",
            birth_year: 20021,
            "household_members": "7+1",
            "qr_codes": [
                'AB11800MCBU80W3',
                "AB11700MCBU80W3",
                "AB11000MCBU80W3",
                "AB11900MCBU80W3"
            ],
            "roles": [
                "683037d677278f98e65612cd"

            ],
            "organization": "685d3ed3b9dd9a6f58376e83",
            uniqid: "MCBU80W3",
            createdBy: "6846a89478e2acf13d707a6b",
            createdAt: "2025-06-25T10:54:49.005Z",
            updatedAt: "2025-07-04T09:31:31.691Z",
            updatedBy: "6846a89478e2acf13d707a6b",
            isConfirmed: true,
            coOwners: ["685bd57893ab310f398819a7"]
        },
         {
            _id: "685bd57893ab310f398819a7",
            username: "rew@vvv.gr1",
            password: "$2b$10$X0VIucnjfd1qXfdufYhoc.99LC1J96udkCgQ2O8QTc/LdjGl5ECpS",
            fullname: "loulis loumpakis21",
            mobile_phone: "6977011112",
            municipality: "Βούλας Βάρης Βιουλαγμένης1",
            street: "μαραθωνος1",
            zipCode: "121311",
            streetNo: "8α1",
            birth_year: 20021,
            "household_members": "7+1",
            "qr_codes": [
                'AB11800MCBU80W3',
                "AB11700MCBU80W3",
                "AB11000MCBU80W3",
                "AB11900MCBU80W3"
            ],
            "roles": [
                "683037d677278f98e65612cd"

            ],
            "organization": "685d3ed3b9dd9a6f58376e83",
            uniqid: "MCBU80W3",
            createdBy: "6846a89478e2acf13d707a6b",
            createdAt: "2025-06-25T10:54:49.005Z",
            updatedAt: "2025-07-04T09:31:31.691Z",
            updatedBy: "6846a89478e2acf13d707a6b",
            isConfirmed: true,
            coOwners: ["685bd57893ab310f398819a7"]
        }
    ];
};



beforeAll(async () => {
    await connect();
    server = app.listen(testPort);
});

afterAll(async () => {
    if (server)
        await server.close();
    await disconnect();
});

describe('POST /requestPassword', () => {

    it('should return 200 for a valid request', async () => {
        const res = await request(app)
                .post(prefix + '/requestPassword')
                .send({username: 'nobody@nowhere.nw'});
        expect(res.status).toBe(200);

    });

    it('should return 400 for invalid post data', async () => {
        const res = await request(app)
                .post(prefix + '/requestPassword')
                .send({usErname: 'nobody@nowhere.nw'});
        expect(res.status).toBe(400);

    });

    it('should return 500 for other errors', async() => {
        await disconnect();
        const res = await request(app)
                .post(prefix + '/requestPassword')
                .send({username: 'nobody@nowhere.nw'});
        expect(res.status).toBe(500);
    });

});


describe("POST /registration", () => {
    it('should return 400 for invalid data', async () => {

        const user = getTestUser();
        delete user.passwordAgain;
        delete user.username;
        const res = await request(app)
                .post(prefix + '/registration')
                .send(user);
        expect(res.status).toBe(400);

    });
});
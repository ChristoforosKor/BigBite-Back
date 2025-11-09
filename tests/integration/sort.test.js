const serverPromise = require('../../main.js');
const request = require('supertest');
const config = require('config');
let server;
describe('Test sorting', () => {
    const log = {
        "username":"admin@mainsys.eu",
        "password": "12345"
    };
    let token;
    let userId;
    const key = config.get("jwtPrivateKey");
    jest.setTimeout(20000);
    beforeAll(async () => {
        server = await serverPromise;
        console.log("API Path:", config.get("apiPath"));
        const loginRes = await request(server)
            .post("/api/v1/auth")
            .send({ username: log.username , password: log.password });

        console.log("Login response status:", loginRes.status);
        console.log("Login response body:", loginRes.body);

        if (loginRes.status !== 200) {
            throw new Error(`Login failed with status ${loginRes.status}`);
        }

        token = loginRes.body.token;
        userId = loginRes.body.user_id;
    });
    it('should sort multiple fields', async () => {
        const res = await request(server)
            .get('/api/v1/coupons')
            .set(key, token)
            .query({
                "sort[0][selector]": "createdAt",
                "sort[0][desc]": "true",
                "sort[1][selector]": "name",
                "sort[1][desc]": "false",
            });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.results)).toBe(true);
        if (res.body.results.length > 1) {
            const first = res.body.results[0];
            const second = res.body.results[1];
            expect(new Date(first.createdAt).getTime()).toBeGreaterThanOrEqual(
                new Date(second.createdAt).getTime()
            );
        }
    });
    afterAll(() => Promise.resolve());
});
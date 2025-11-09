const server = require("../main.js");
const request = require('supertest');
const config = require('config');

describe('Coupon CORS', () => {
    const coupon= {
        "name" : "ΕΚΠΤΩΣΗ1",
        "offer_type" : "Έκπτωση",
        "discount_percentage" : 30.00,
        "unit_price"  :   1.00,
        "start_date" : "2024-01-02T00:00:00.000Z",
        "end_date" :  "2025-12-30T00:00:00.000Z",
        "partner" : "6853d7fe2ed0ca8adcf1608a"
    };
    const log = {
        "username":"test@vvv.gr",
        "password": "12345"
    };
    let token;
    let couponId;
    const key = config.get("jwtPrivateKey");
    beforeAll(async () => {
        const loginRes = await request(server)
            .post("/api/v1/auth")
            .send({ username: log.username , password: log.password });
        token = loginRes.body.token;
        console.log("Token:", token);
    });
    it('should create a new coupon', async () => {
        const res = await request(server)
            .post('/api/v1/coupons')
            .set(key, token)
            .send(coupon);
        expect(res.status).toBe(200);
        couponId = res.body._id;
    });
    it('should get all coupons', async () => {
        const res = await request(server)
            .get('/api/v1/coupons')
            .set(key, token);
        expect(res.status).toBe(200);
    });
    it('should update by id', async () => {
        const res = await request(server)
            .put(`/api/v1/coupons/${couponId}`)
            .set(key, token)
            .send({ ...coupon, name: "Updated Coupon" });
        expect(res.status).toBe(200);
    });
    it('should delete by id', async () => {
        const res = await request(server)
            .delete(`/api/v1/coupons/${couponId}`)
            .set(key, token);
        expect(res.status).toBe(200);
    });
    afterAll((done) => {
        if (server && server.close) {
            server.close(done);
        } else {
            done();
        }
    });
});
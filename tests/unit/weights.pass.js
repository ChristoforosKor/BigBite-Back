const request = require('supertest');
const mongoose = require('mongoose');
const { Weight } = require('../models/weights');
const app = require('../app'); // your Express app
const db = require('../startup/db');

describe('POST /api/v1/weights', () => {

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should add a weight record to DB through kafka', async () => {
    const payload = {
      clientID: 1,
      weightInfo: [{ bagCode: "ABC123", weight: 100 }],
      timestamp: Date.now
    };

    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NmYyOTFjOTRlZGZhMDY4MTQ2NWNkOTQiLCJyb2xlcyI6WyJhZG1pbiJdLCJpYXQiOjE3NDczMTU5Njd9.IQ7tCnFHk0p8iEO4CwtTxx8luUam96VwEvZFp-snNqg';

    const res = await request(app)
      .post('/api/v1/weights')
      .send(payload);

    expect(res.status).toBe(201);

    const record = await Weight.findOne({ clientID: 1, 'weightInfo.bagCode': 'ABC123' });
    expect(record).not.toBeNull();

    // weight is stored as string in model, so compare string or convert accordingly
    expect(record.weightInfo[0].weight).toBe("100");
  });
});

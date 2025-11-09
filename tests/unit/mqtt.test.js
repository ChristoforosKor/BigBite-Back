const server = require("../main.js");
const request = require("supertest");
const { asyncLocalStorage } = require("../lib/sessionstorage");
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const config = require('config');
const clientId = 'emqx_nodejs_' + Math.random().toString(16).substring(2, 8)
const host = config.get('mqttAddress');
const mqttPort = config.get('mqttPort');
const username = config.get('mqttUsername');
const password = config.get('mqttPassword');
const topic = config.get('mqttTopic');

describe('MQTT Message Processing', () => {
    let mqttClient;
    let device;
    let token;
    const key = config.get("jwtPrivateKey");

    beforeAll(async () => {
        device = {
            "deviceId": "3",
            "title": "κάδος τεστ",
            "type": "BIN"
        };
        const log = {
            "username":"test@vvv.gr",
            "password": "12345"
        };
        const loginRes = await request(server)
            .post("/api/v1/auth")
            .send({ username: log.username , password: log.password });
            token = loginRes.body.token;
        await request(server)
            .post("/api/v1/devices")
            .set(key, token)
            .send(device);
        
        mqttClient = mqtt.connect(host, {
            port: mqttPort,
            clientId,
            username,
            password
        });

        await new Promise((resolve) => {
            mqttClient.on("connect", () => {
                console.log("✅ MQTT Test Client connected.");
                resolve();
            });
        });
    });

    it('should increase weights count after MQTT payload is processed', async () => {

        const payload = {
            clientID: 3,
            bulkMobileCouponBindingModel: [
                {
                    bagCode: "P37893557838PH",
                    weight: "15"
                }
            ],
            battery: 80,
            fill: 55,
            location: {
                latitude: 37.7749,
                longitude: -122.4194
            },
            weightDate: "2024-12-01T14:30:00.000Z"
        };

        // Count weights before
        const beforeRes = await request(server)
        .get("/api/v1/weights")
        .set(key, token)
        .send();
        const beforeCount = beforeRes.body.count;
        console.log(`Weights count before: ${beforeCount}`);

        // Publish the MQTT message
        mqttClient.publish(topic, JSON.stringify(payload), { qos: 2 });

        // Wait and poll for the count to increase
        let afterCount = beforeCount;
        const timeout = Date.now() + 5000; // up to 5 seconds

        while (Date.now() < timeout) {
            await new Promise((res) => setTimeout(res, 300)); // wait 300ms

            const afterRes = await request(server)
                .get("/api/v1/weights")
                .set(key, token)
                .send();

            afterCount = afterRes.body.count;
            console.log(`Weights count after: ${afterCount}`);
            if (afterCount > beforeCount) break;
        }

        expect(afterCount).toBeGreaterThan(beforeCount);
    });

    afterAll(async () => {
        if (mqttClient && mqttClient.end) {
            mqttClient.end(true); // force close
        }

        if (server && server.close) {
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    });
});

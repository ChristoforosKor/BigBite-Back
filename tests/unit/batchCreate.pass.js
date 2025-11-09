/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */

const request = require("supertest");
let server;
describe("/weights", () => {
  beforeEach(() => {
    server = require("../main.js");
  });
  afterEach(() => {
    server.close();
  });
  describe("POST/", () => {
    it("should post a new weight", async () => {
      const res = await request(server)
        .post("/api/v1/weights/batchCreate")
        .send([
          {
            clientID: 22222,
            weightInfo: [
              {
                bagCode: "321",
                weight: 1250,
              },
            ],
            timestamp: "2024-11-22T13:13:52.897+00:00",
          },
          {
            clientID: 333333,
            weightInfo: [
              {
                bagCode: "322",
                weight: 1250,
              },
            ],
            timestamp: "2024-11-22T13:13:52.897+00:00",
          },
        ]);
      expect(res.status).toBe(200);
    });
  });
  describe("PUT/", () => {
    it("should change the bagCode status to active", async () => {
      const res = await request(server)
        .put("/api/v1/weights/bagCode/682b25e487987ec1b078405f")
        .send({});
      expect(res.status).toBe(200);
    });
  });
});

const request = require("supertest");
const server = require("../main.js");
const config = require('config');

describe('weight Tests as SU', () => {
    let weight;
    let weightId;
    const key = config.get("jwtPrivateKey");
    beforeAll(async () => {
  const res = await request(server)
    .post('/api/v1/auth')
    .send({
      username: 'test@vvv.gr',
      password: '12345',
    });
  authToken = res.body.token; 
});
    beforeEach(() => {
        weight = {
        qr_code: 'AB1108MBJFAGU3',
        weight: 1200,
        color: '68404f6f8acb2cc969bf00f7'
    }
    });
          afterAll(() => {
    server.close(); 
  });
    
   
  describe("POST/", () => {
    it("should post a new weight", async () => {
      const res = await request(server)
        .post("/api/v1/weights")
        .send(weight).set(key, authToken);
      expect(res.status).toBe(201);
      weightId  =res.body._id;
      
    });
  });

 describe("GET /", () => {
    it("should get all weights", async () => {
      const res = await request(server)
        .get("/api/v1/weights").set(key, authToken);
      
      expect(res.status).toBe(200);
    });
  });

  describe("PUT /:id", () => {
    it("should update the weight", async () => {
      weight.weight = 1300 ;
      const res = await request(server)
        .put(`/api/v1/weights/${weightId}`)
        .send(weight)
        .set(key, authToken);
      expect(res.status).toBe(200);
    });
  });


  describe("DELETE /:id", () => {
    it("should delete the weight", async () => {
      const res = await request(server)
        .delete(`/api/v1/weights/${weightId}`)
        .set(key, authToken);
      
      expect(res.status).toBe(200); 
    });
  });
});

describe ('weight Tests to see only the same organization', () => {
  let authToken;
  let key = config.get("jwtPrivateKey");
  let weightOrg;
  let weightOfOtherOrg;
  let org ;
  let weightOfOrgId;
  let weightOfOtherOrgId = "685a74692d99ca22c9dd088c";
  
  //THIS USER HAS ONLY ORGANIZATION AND NOT DELETE PERMISSIONS
  
  beforeAll(async () => {
    org = "6840478e5f6181f5683c61eb";
    const res = await request(server)
      .post('/api/v1/auth')
      .send({
        username: 'test@organization.gr',
        password: '12345',
      });
    authToken = res.body.token;
  });

  beforeEach(async () => {
     weightOrg = { qr_code: 'AB1108MC4KEC8V',
        weight: 1000,
        collectionPoint:'684bd5e832700c105aaf8ade',
            color: '68404f6f8acb2cc969bf00f7'
}
    const weight = await request(server)
      .post('/api/v1/weights')
      .set(key, authToken)
      .send(weightOrg);
   
     weightOfOrgId = weight.body._id;
     
      weightOfOtherOrg ={
        qr_code: 'AB1108MC4KEC8V',
        weight: 1500,
        collectionPoint:'684bd5e832700c105aaf8ade',
        organization: "684c146bd04451e797cd17f3"
      };

  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/v1/weights', () => {
    it('should return only weights from user organization', async () => {
      const res = await request(server)
        .get('/api/v1/weights')
        .set(key, authToken);

      expect(res.status).toBe(200);

      res.body.results.forEach((weight) => {
        expect(weight.organization._id).toBe(org);
      });
    });
  });

  describe('PUT /api/v1/weights/:id', () => {
    it('should allow updating weight from user organization', async () => {
        weightOrg.weight = 1300;
      const res = await request(server)
        .put(`/api/v1/weights/${weightOfOrgId}`)
        .set(key, authToken)
        .send(weightOrg);

      expect(res.status).toBe(200);
    });


    it('should NOT allow updating weight from a different organization', async () => {
     weightOfOtherOrg.weight = 1600;
      const res = await request(server)
        .put(`/api/v1/weights/${weightOfOtherOrgId}`)
        .set(key, authToken)
        .send(weightOfOtherOrg);
   
         expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/weights/:id', () => {
    it('should NOT allow deleting weights if can see org but not delete', async () => {
      const res = await request(server)
        .delete(`/api/v1/weights/${weightOfOrgId}`)
        .set(key, authToken);

    });
  });
});
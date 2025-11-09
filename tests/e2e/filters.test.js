const http = require("http");
const requestLib = require("supertest");
const app = require('../../app');
const { connect, disconnect } = require ('../../startup/db');


const apiPrefix = "/api/v1";
const term1 = "test";
const term2 = true;
const term3 = 'ΠΕΙΡΑΙ';
const filterCouponsContains1 = `requireTotalCount=true&searchOperation=contains&skip=0&take=20&filter[]=name&filter[]=contains&filter[]=${term1}`;
const filterCouponsContains2 = `requireTotalCount=true&searchOperation=contains&skip=0&take=20&filter[0][0]=name&filter[0][1]=contains&filter[0][2]=${term1}t&filter[1]=and&filter[2][0]=isActive&filter[2][1]=%3D&filter[2][2]=${term2}`;
const filterCouponsContains3 = `requireTotalCount=true&searchOperation=contains&skip=0&take=20&filter[]=organization.organizationName&filter[]=contains&filter[]=${term3}`;
const filterCouponsContains4 = `requireTotalCount=true&searchOperation=contains&skip=0&take=20&filter[0][0]=isActive&filter[0][1]=%3D&filter[0][2]=${term2}&filter[1]=and&filter[2][0]=organization.organizationName&filter[2][1]=contains&filter[2][2]=${term3}`;

let server;
let request;
let adminId, adminAccessToken, adminRefreshToken;
let politisId, politisAccessToken, politisRefreshToken;
let ipalilosId, ipallilosAccessToken, iplallilosRefreshToken;
let sinergatisId, sinergatisAccessToken, sinergatisRefreshToken;



const admin = {
  user: 'admin@mainsys.eu',
  password: '12345'
};

const ipalilos = {
    user: 'worker@test.gr',
    paswword: '12345'
};
const sinergatis = {
    user: 'userpeireas@mail.com',
    password: '12345'
};

const dimotis = {
    user:"userdimotispeirea@mail.com",
    password: "12345"
};

const isAnOwner = (userId, createdBy, coOwners) => {
  if (userId === createdBy) return true;
  if (coOwners.includes(userId)) return true;
  return false;
};

beforeAll(async () => {
  await connect();

  server = http.createServer(app).listen(0);
  request = requestLib(server);
  const url = apiPrefix + '/auth';
  
  const res = await request
    .post(url)
    .send({ username: admin.user, password: admin.password });
//     console.log(res.body);
  adminAccessToken = res.body.accessToken || res.body.token;
  adminRefreshToken = res.body.refreshToken;
  adminId = res.body.user_id;
 
  const resPolitis = await request
    .post(url)
    .send({ username: dimotis.user, password: dimotis.password }).expect(200); 
  politisAccessToken = resPolitis.body.accessToken || resPolitis.body.token;
  politisRefreshToken = resPolitis.body.refreshToken;
  politisId = resPolitis.body.user_id;
  
  const resIpalilos = await request
    .post(url)
    .send({ username: ipalilos.user, password: ipalilos.paswword }) 
    .expect(200);
    ipallilosAccessToken = resIpalilos.body.accessToken || resIpalilos.body.token;
    ipalilosRefreshToken = resIpalilos.body.refreshToken;
    ipalilosId = resIpalilos.body.user_id;
//    console.log(resIpalilos.body);
  
const resSinergatis = await request
    .post(url)
    .send({ username: sinergatis.user, password: sinergatis.password }) 
    .expect(200);
  sinergatisAccessToken = resSinergatis.body.accessToken || resSinergatis.body.token;
  sinergatisRefreshToken = resSinergatis.body.refreshToken;
  sinergatisId = resSinergatis.body.user_id;

});
////
afterAll(async () => {
  await disconnect?.();
  await new Promise((r) => server.close(r));
});
//
test('it should return loged in user profile', async () => {
  const res = await request
          .get(apiPrefix + '/users/me')
          .set('x-recyclebin-jwtPrivateKey', adminAccessToken);
  const username = res.body.user.username;
// 
  expect(username).toBe('admin@mainsys.eu');
  
  const resPolitis = await request
          .get(apiPrefix + '/users/me')
          .set('x-recyclebin-jwtPrivateKey', politisAccessToken);
  const politisUsername = resPolitis.body.user.username;
  expect(politisUsername).toBe('userdimotispeirea@mail.com');
  
  const resSinergaits = await request
          .get(apiPrefix + '/users/me')
          .set('x-recyclebin-jwtPrivateKey', sinergatisAccessToken);
  const sinergatisUsername = resSinergaits.body.user.username;
  expect(sinergatisUsername).toBe('userpeireas@mail.com');
//  
  const resIpalilos = await request
          .get(apiPrefix + '/users/me')
          .set('x-recyclebin-jwtPrivateKey', ipallilosAccessToken);
  const ipalilosUsername = resIpalilos.body.user.username;
  expect(ipalilosUsername).toBe('worker@test.gr');
//  
});

it('should return users records from diferent users loged in as super user', async () => {
    const res = await request
          .get(apiPrefix + '/users/')
          .set('x-recyclebin-jwtPrivateKey', adminAccessToken);
    const found = res.body.results.some(record => {
        return !isAnOwner(adminId, record.createdBy, record.coOwners);
    });  
    
    expect(found).toBe(true);
});

it ('should return only owner users records when loged in as politis', async () => {
    const res = await request
          .get(apiPrefix + '/users')
          .set('x-recyclebin-jwtPrivateKey', politisAccessToken);
    
    const found = res.body.results.some( record => {
        return !isAnOwner(politisId, record.createdBy, record.coOwners );
    });
    
    expect(found).toBe(false);
});

//
//it ('should return only organization records when loged in as ipalilos', async () => {
//    const res = await request
//          .get(apiPrefix + '/coupons')
//          .set('x-recyclebin-jwtPrivateKey', ipallilosAccessToken);
//    
//     const found = res.body.results.some( record => {
//        return !isAnOwner(ipalilosId, record.createdBy, record.coOwners );
//    });
//    expect(found).toBe(true);
//});
////
//it ('should return only coupons records that match filter 1', async () => {
//    const res = await request
//          .get(apiPrefix + '/coupons?' + filterCouponsContains1)
//          .set('x-recyclebin-jwtPrivateKey', ipallilosAccessToken);
//    const isValid = res.body.results.every(record => {
//        return record.name.toLowerCase().includes(term1.toLowerCase());
//    });    
//
//    expect(isValid).toBe(true);
//});
//
//it ('should return only coupons records that match filter 2', async () => {
//    const res = await request
//          .get(apiPrefix + '/coupons?' + filterCouponsContains2)
//          .set('x-recyclebin-jwtPrivateKey', ipallilosAccessToken);
//    console.log(res.body.results);
//    
//    const isValid = res.body.results.every(record => {
//        return record.name.toLowerCase().includes(term1.toLowerCase()
//                && record.isActive == true);
//    });
//
//
//    expect(isValid).toBe(true);
//});

it ('should filter inner organizationName field ', async () => {
    const res = await request
          .get(apiPrefix + '/coupons?' + filterCouponsContains3)
          .set('x-recyclebin-jwtPrivateKey', adminAccessToken);
    const term = term3.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const result = res.body.results.every(coupon => {
        const org = coupon.org.organizationMunicipality.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
        const r = org.includes(term);
        return r;
    });
    expect(result).toBe(true);
});


it ('should cobine filter inner organizationName field with upper field ', async () => {
    const res = await request
          .get(apiPrefix + '/coupons?' + filterCouponsContains4)
          .set('x-recyclebin-jwtPrivateKey', adminAccessToken);
    const term = term3.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const result = res.body.results.every(coupon => {
        const org = coupon.org.organizationMunicipality.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
        const r = org.includes(term);
        return r;
    });
//    myLog(res.body);
    expect(result).toBe(true);
});



const myLog = (item) => {
    console.log(JSON.stringify(item, null, 2));
};
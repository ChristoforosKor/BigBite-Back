//
//recycleTokensInstance = require('../models/recycletokens');
//
//
//
//const after5Days = new Date(new Date().getTime() + (5 * 24 * 60 * 60 * 1000));
//
//
//describe('Stored Recycle Tokens Tests', () => {
//    let token;
//    beforeEach(()=>{
//        token = {
//    access_token: 'eVS41EJ3AFJBnYRBxALfEARqVcRaSdMVuDJOA0_QVR0U_gEiaJ7iOvrqBOtAzXVaSjX-fbd4GQtDdb7TZSk1BaCI9JXNEJq0a1_sdJIV0JZRASa-ofYrEcqf6oFQ62pptLlribBbOccSgIE9yGlsxDtjjhhbCy78ydZGpxaRsFMEGdHKbDbEWpdzF4D3dioT3b7dxw7G7ShsJ_vHIZbN7a3ZNZUZi_7ahB3jf7jKH3MLq2aexg1zQAnr9Qk93NO8a5JzPE7sVPH4ztU4aZf9BrwHSTdtnUaxfEXMWptieNcLyf8xcqZKEMu8mPhc-5wxum-ojvFMLkAe1bdJfzCRff7BH8s6dYj-JCp0J7kkBUTnDURAzwc-4Fqp3A4Yca_ZC455Ni6p2JURWD7iG1RxL5UWpsPuOqfZHPcDUCAHL0e8Hn92ngN9bO4KQll4pbJCvp-pmHb8lO2X6J9Ukn4XGWoGYptArEMCR9GX5y8O1sNYvhW4KbjWjMEwv8qglWyPwU4Yq18uvTZFKPgTM3XlSQpun-HUvPGOSRSHgDmkX-xauMWLNDlONDEt08l7W15y8M_5ZdiE7FKzRQTqzLFKhUi0jfLIi5jzSIHEGGAok5S4vxYQUDmWDhNcpYghROvrq345L8ASDKAVlIFQecOL9msktm_q7314Swv77o4UErJKwZrAJL3L1wGe-_oyvDTP',
//    token_type: 'bearer',
//    expires_in: 28799,
//    userName: 'worker1@vvv.gr',
//    fullName: 'worker',
//    role: 'Workers',
//    companyName: '',
//    userId: '968562f8-0939-e911-80ce-000d3ab18b8e',
//    isMunicipalitySU: 'False',
//    loginType: '',
//    userFrom: '2',
//    cyclefiUser: 'False',
//    tk: '16672',
//    muncipality: 'ΒΑΡΗΣ-ΒΟΥΛΑΣ-ΒΟΥΛΙΑΓΜΕΝΗΣ',
//    householdId: '0',
//    '.issued': 'Thu, 20 Jul 2023 13:47:47 GMT',
//    '.expires': 'Thu, 20 Jul 2023 21:47:47 GMT'
//};
//
//    })
//    it('should return a zero for tokens count', () => {
//        recycleTokensInstance.emptyTokens();
//        const count = recycleTokensInstance.getTokensCount();
//        expect(count).toEqual(0);
//    });
//
//
//    it('adds a new token and the count of tokens should greater by 1 from the previous count of tokens ', () => {
//        const count = recycleTokensInstance.getTokensCount();
//        recycleTokensInstance.putToken(token);
//        const count2 = recycleTokensInstance.getTokensCount();
//        expect(count2).toBeGreaterThan(count);
//    });
//
//
//    it('adds an existing token and should return a count that is equal the previous count of the tokens array', () => {
//        const count = recycleTokensInstance.getTokensCount();
//        recycleTokensInstance.putToken(token);
//        const count2 = recycleTokensInstance.getTokensCount();
//        expect(count2).toBe(count);
//    });
//
//
//    it('Should retuns two tokens that is the same instance in two subsequent request to find the same token ', () => {
//        const result = recycleTokensInstance.findToken(token.access_token);
//        recycleTokensInstance.putToken(token);
//        const result2 = recycleTokensInstance.findToken(token.access_token);
//        expect(JSON.stringify(result)).toBe(JSON.stringify(result2));
//
//    });
//
//
//    it('Should return false for an empty token', () => {
//        const result = recycleTokensInstance.isTokenExpired('');
//        expect(result).toBe(false);
//    });
//
//
//    it('Should return false valid token for an empty token', () => {
//        const result = recycleTokensInstance.isTokenValid('');
//        expect(result).toBe(false);
//    });
//
//
//    it('Should return false valid token for a null token', () => {
//        const result = recycleTokensInstance.isTokenValid('');
//        expect(result).toBe(false);
//    });
//
//
//    it('Should return false valid token for a non existing token', () => {
//        const result = recycleTokensInstance.isTokenValid('--');
//        expect(result).toBe(false);
//    });
//
//
//    it('Should return false valid token for an expired token', () => {
//        const result = recycleTokensInstance.isTokenValid(token);
//        expect(result).toBe(false);
//    });
//
//
//    it('Should return true valid token for a non expired token', () => {
//        token['.expires'] = 'Tue, 20 May 2025 21:47:47 GMT';
//        const result = recycleTokensInstance.isTokenValid(token);
//        expect(result).toBe(false);
//    });
//});
//
//describe('Remote Tokens from crm or mixed calls', () => {
//
//   
//    it ('Should return status 400 when requesting new token with bad credentials', async () => {
//        const result = await recycleTokensInstance.requestNewToken();
//        expect(result.response.status).toEqual(400);
//    });
//    
//    it ('Should request new remote token and return status 200 and a token expiring in the future when requesting with correct credentials', async () => {
//       const result = await recycleTokensInstance.requestNewToken('worker1@vvv.gr', 'worker1');
//       expect(result.status).toEqual(200);
//       expect(new Date(result.data['.expires']) - new Date()).toBeGreaterThan(0);
//    });
//    
//
//     it('Should return status 400 when trying get a token with bad credentials', async () => {
//        const token = await recycleTokensInstance.requestNewToken('worker1@vvv.gr', 'worker1');
//        const result =  await recycleTokensInstance.getValidToken(token.access_token, 'worker1@vvv.gr',  'worker');
//        expect(result.response.status).toEqual(400);             
//    });
//    
//    it('Should get a valid token if supplied correct credentials expiring in the future with status code 200', async () => {
//        const result = await recycleTokensInstance.requestNewToken('worker1@vvv.gr', 'worker1');
//        expect(result.status).toEqual(200);
//        expect(result.data.access_token).toBeDefined();
//        expect(new Date(result.data['.expires']) - new Date()).toBeGreaterThan(0);                
//    });
//
//});
//
//
//
//
//
//

const request = require('supertest');
const startServer = require('../../../main'); 
const numericObjectToArray = require('../../../utils/numericObjectToArray');
let server, agent, token;
const prefix = '/api/v1/users';
const testPort = 30001;



beforeAll(async() => {
    server = await startServer();
    agent = request.agent(server);
    const res = await agent
           .post('/api/v1/auth/')
           .send({username: 'admin2@mainsys.eu', password: '12345'});
   token = res.get('x-recyclebin-jwtprivatekey');
   
});

afterAll( () => {
    new Promise(r => server.close(r));
});
//const res = await agent.get(prefix + '/?requireTotalCount=true&searchOperation=contains&skip=0&take=20&filter[0][0]=username&filter[0][1]=contains&filter[0][2]=s.valis&filter[1]=and&filter[2][0]=fullname&filter[2][1]=contains&filter[2][2]=s&filter[3]=and&filter[4][0]=organization.organizationName&filter[4][1]=contains&filter[4][2]=sd');
describe('Test numeric ObjectTo Array', () => {
    
    it('should return null if null data provided', async () => { 
        const result = numericObjectToArray(null);
        expect(result).toBe(null);
    });
    
    it ('should return an array if object with one level given', () => {
        const numObj = {
                             "0": "username", "1": "contains", "2": "s.valis"
                            
                        };
        const result = numericObjectToArray(numObj);
        const expected = [ 'username', 'contains', 's.valis' ];                                                                                                                                                                                
        expect(result).toEqual(expected);
    });
    
      
    it ('should return the corresponding array if numeric object given with multiple levels', () => {
        const numObj = {
                            "0": { "0": "username", "1": "contains", "2": "s.valis" },
                            "1": "and",
                            "2": { "0": "fullname", "1": "contains", "2": "s" },
                            "3": "and",
                            "4": { "0": "organization.organizationName", "1": "contains", "2": "sd" }
                        };
         const result = numericObjectToArray(numObj);
         const expected =   [                                                                                                                                                                                                                             
                [ 'username', 'contains', 's.valis' ],                                                                                                                                                                                      
                'and',
                [ 'fullname', 'contains', 's' ],
                'and',
                [ 'organization.organizationName', 'contains', 'sd' ]
              ];

         expect(result).toEqual(expected);
        
    });
    
    
    it ('should return the same object if the input does not have not purely numeric keys', () => {
        const input = { "test": "username", "test2": "contains", "2": "s.valis"  };
        const result = numericObjectToArray(input);
        expect(result).toEqual(input);
        
    });
    
    it ('should return transform only sub objects that have pure numeric keys and string keys to be on the bottom', () => {
         const input = {
                            "test1": { "0": "username", "1": "contains", "2": "s.valis" },
                            "1": "and",
                            "test2": { "0": "fullname", "1": "contains", "2": "s" },
                            "3": "and",
                            "4": { "0": "organization.organizationName", "1": "contains", "2": "sd" }
                        };
        const expected =  {                                                                                                                                                                                                                             
            '1': 'and',                                                                                                                                                                                                                 
            '3': 'and',
            '4': [ 'organization.organizationName', 'contains', 'sd' ],
            test1: [ 'username', 'contains', 's.valis' ],
            test2: [ 'fullname', 'contains', 's' ]
        };

        const result = numericObjectToArray(input);
        expect(result).toEqual(expected);
        
    });
      
});
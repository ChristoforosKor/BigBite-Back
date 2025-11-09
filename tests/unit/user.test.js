//const request = require("supertest");
//const config = require('config');
const app = require('../../app');
const {connect, disconnect} = require('../../startup/db');


//const {User, validate} = require('../../models/schemas/users');
//const sendMail = require('../../lib/sendMail');
jest.mock('../../models/shemas/users', () =>{
    const chain = (result) => ({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(result)
    });
    
    const User = jest.fn(function(doc){
        Object.assign(this, doc);
        this.save = jest.fn().mockResolvedValue(this);
    });
    
    User.findById = jest.fn();
    User.findOne = jest.fn();
    User.findOneAndUpdate = jest.fn();
    User.findOneAndDelete = jest.fn();
    
    return  {
        User,
        validate: jest.fn(() =>({error: null, value:{}})),
        _helpers: {chain}
        
    }

});


jest.mock('../../models/schemas/organizations', () => {
   const chain = (result) => ({
      populate: jest.fn().mockResolvedValue(result) 
   }); 
   
   return {
       organizationModel: {
           findById: jest.fn(),
           findOne: jest.fn()
       },
       
       organizationValidate: jest.fn(
               ()=>({error: null, value:{} })),
       __helpers: {chain}
       
   };
});

jest.mock('../../models/sessions', () => ({
    clientsession: jest.fn()
}));

jest.mock('uniqid', () => ({
    time: jest.fn()
}));

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

jest.mock('config', () => ({
  get: jest.fn(),
}));

jest.mock('../../lib/sendMail', () => jest.fn());


const { User, __helpers: userHelpers} = require('../../models/schemas/users');
const { organizationModel, __helpers:orgHelpers} = require('../../models/schemas/orginazations');
const sessionModel = require('../../models/session');
const uniqid = require('uniqid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const sendMail = require('../../lib/sendMail');

//const key = config.get("jwtPrivateKey");

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


beforeAll(async () => {
    await connect();
    server = app.listen(testPort);

});

afterAll(async () => {
    if (server) await server.close();
     await disconnect();
});

beforeEach(()=>{
   jest.clearAllMocks(); 
});


describe(register, () => {
   it('should create a new user', async () => {
       User.findOne
               .mockResolvedValueOnce(null)
               .mockResolvedValueOnce(null);
   }); 
});

describe("User Validation", () => {
    
    /////username
    it("should not pass for missing username", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        delete user.username;
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    it("should not pass for username < 5", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.username = "1";
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    it("should not pass for username > 50", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.username = "123456789012345678901234567890123456789012345678901234567890";
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    ///// password
    it("should not pass for missing password", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        delete user.password;
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }
    });
   
     it("should not pass if passwordAgain is given ", () => {
        const user = getTestUser();
        try {
            const {value} = validate(user);
            throw new Error('It should have throw');
        } catch(error) {
           expect(error.code).toBe(40000);
        }

    });
    
    it("should not pass for password < 5", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.password = "1";
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    it("should not pass for password > 50", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.password = "123456789012345678901234567890123456789012345678901234567890890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789089012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678908901234567890123456789012345678901234567890";
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            console.log(error);
            expect(error.code).toBe(40000);
        }

    });       
    
    ///// mobile_phone
    it("should not pass for missing mobile phone", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        delete user.mobile_phone;
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }
    });
   
    it("should not pass for numeric mobile_phone < 10", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.mobile_phone = 1;
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    it("should not pass for numeric mobile phone > 10", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.mobile_phone = 123456789012;
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    it("should not pass for String mobile_phone < 10", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.mobile_phone = "1";
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    it("should not pass for string mobile phone > 10", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.mobile_phone = "123456789012345678901234567890123456789012345678901234567890";;
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    /////municiplaity
    it("should not pass for missing municipality", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        delete user.municipality;
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }
    });
   
    it("should not pass empty municipality", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.municiplaity = "";
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    it("should not pass for municipality > 50", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.municipality = "123456789012345678901234567890123456789012345678901234567890";
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    ///// street
    it("should not pass for missing street", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        delete user.street;
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }
    });
   
    it("should not pass for empty street", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.street = "";
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    it("should not pass for street > 100", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.street = "123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890";
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            
            expect(error.code).toBe(40000);
        }

    });
    
    
    /////zipCode
    it("should not pass for missing zip code", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        delete user.zipCode;
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }
    });
   
    it("should not pass for empty zip", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.zipCode = "";
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    it("should not pass for zip code > 5", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        user.zipCode = "123456789012345678901234567890123456789012345678901234567890";
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }

    });
    
    /////street no
    it("should not pass for missing street number", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        delete user.streetNo;
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }
    });
    
    /////street no
    it("should not pass for missing street number", () => {
        const user = getTestUser();
        delete user.passwordAgain;
        delete user.streetNo;
        try {
            validate(user);
            throw new Error('It should have throw');
        } catch(error) {
            expect(error.code).toBe(40000);
        }
    });
    
    /////isConfirmed
    it('should default to false when missing isConfirmed', () => {
       const user = getTestUser();
       delete user.passwordAgain;
       delete user.isConfirmed;
       try {
           const value = validate(user);
           expect(value.isConfirmed).toBe(false);           
       } catch(error) {
           console.log(error);
           throw new Error("It should have passed");
       }
    });
    
    it('should accept boolean true for isConfirmed', () => {
       const user = getTestUser();
       delete user.passwordAgain;
       user.isConfirmed =  true;
       try {
           const value = validate(user);
           expect(value.isConfirmed).toBe(true);           
       } catch(error) {
           console.log(error);
           throw new Error("It should have passed");
       }
    });
    
    it('should accept boolean false for isConfirmed', () => {
       const user = getTestUser();
       delete user.passwordAgain;
       user.isConfirmed = false;
       try {
           const value = validate(user);
           expect(value.isConfirmed).toBe(false);           
       } catch(error) {
           console.log(error);
           throw new Error("It should have passed");
       }
    });
    
    it('should fail  for non boolean isConfirmed', () => {
       const user = getTestUser();
       delete user.passwordAgain;
       user.isConfirmed = 'yes';
       try {
            validate(user);
            throw new Error('It should have throw');         
       } catch(error) {
            expect(error.code).toBe(40000);
       }
    });
    
    /////birth year
    it('should pass for missing birth_year', () => {
       const user = getTestUser();
       delete user.passwordAgain;
       delete user.birth_year;
       try {
            validate(user);
        } catch(error) {
            console.log(error);
            throw new Error("It should have passed");
       }
    });
    
    /////household_members
    it('should pass for missing househodle_members', () => {
       const user = getTestUser();
       delete user.passwordAgain;
       delete user.household_members;
       try {
            validate(user);
        } catch(error) {
            console.log(error);
            throw new Error("It should have passed");
       }
    });
    
    /////powd_supply_number
    it('should pass for empty power_supply_number', () => {
        const user = getTestUser();
        delete user.passwordAgain;
        delete user.power_supply_number;
        try {
            validate(user);
        } catch(error) {
            console.log(error);
            throw new Error("It should have passed");
       }
    });
    
        ///// happy path
    it("should pass if none of the above happens ", () => {
        const user = getTestUser();
         delete user.passwordAgain;
        try {
            value = validate(user);
            expect(value.username).toBe(user.username);
        } catch(error) {
            console.log(error);
            throw new Error("It should have passed");
        }

    });
    

});



//describe("requestPassword", () => {
//
//
//    beforeEach(() => {
//        jest.clearAllMocks();
//    });
//
////       const {requestPassword} = require('../models/users');
//    it("should throw *Not Found* with code 4004 for non-existing username", async () => {
//
//        User.findOne.mockResolvedValue(null);
//        const data = {username: 'nobody@nowhere.gr'};
//        await expect(requestPassword(data)).rejects.toMatchObject({
//            message: expect.stringContaining('Not Found'),
//            code: 4004
//        });
//        expect(sendMail).not.toHaveBeenCalled();
//    });
//
//    it("should throw *Bad Request* for missing username field", async () => {
//
//        const data = {useErname: 'typo@nowhere.gr'};
//        await expect(requestPassword(data)).rejects.toMatchObject({
//            message: expect.stringContaining('Bad Request'),
//            code: 4000
//        });
//        expect(sendMail).not.toHaveBeenCalled();
//    });
//
//    it('should send mail if user is found', async () => {
//
//        const email = 'admin@mainsys.eu';
//        User.findOne.mockResolvedValue({username: email});
//        sendMail.mockResolvedValue();
//
//        await requestPassword({username: email});
//
//        expect(sendMail).toHaveBeenCalledTimes(1);
//
//        const[to, subject, html] = sendMail.mock.calls[0];
//        expect(to).toBe(email);
//        expect(subject).toBe('Αλλαγή κωδικού');
//        expect(html).toContain('/users/resetPassword?token=');
//
//    });
//
//});



//
//describe("requestPassword()", () => {
//
//
//    beforeEach(() => {
//        jest.clearAllMocks();
//    });
//
////       const {requestPassword} = require('../models/users');
//    it("should throw *Not Found* with code 4004 for non-existing username", async () => {
//
//        User.findOne.mockResolvedValue(null);
//        const data = {username: 'nobody@nowhere.gr'};
//        await expect(requestPassword(data)).rejects.toMatchObject({
//            message: expect.stringContaining('Not Found'),
//            code: 4004
//        });
//        expect(sendMail).not.toHaveBeenCalled();
//    });
//
//    it("should throw *Bad Request* for missing username field", async () => {
//
//        const data = {useErname: 'typo@nowhere.gr'};
//        await expect(requestPassword(data)).rejects.toMatchObject({
//            message: expect.stringContaining('Bad Request'),
//            code: 4000
//        });
//        expect(sendMail).not.toHaveBeenCalled();
//    });
//
//    it('should send mail if user is found', async () => {
//
//        const email = 'admin@mainsys.eu';
//        User.findOne.mockResolvedValue({username: email});
//        sendMail.mockResolvedValue();
//
//        await requestPassword({username: email});
//
//        expect(sendMail).toHaveBeenCalledTimes(1);
//
//        const[to, subject, html] = sendMail.mock.calls[0];
//        expect(to).toBe(email);
//        expect(subject).toBe('Αλλαγή κωδικού');
//        expect(html).toContain('/users/resetPassword?token=');
//
//    });




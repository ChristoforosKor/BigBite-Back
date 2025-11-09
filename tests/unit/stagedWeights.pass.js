const { before } = require('lodash');

const {weightModel} = require('../models/weights');


describe('Weight Tests', () => {
    let object;
    beforeEach(()=>{
                object = {
            "clientID": 22222,
            "bulkMobileCouponBindingModel": [{
                "bagCode":"321",
                "weight": 1250
            }],
            "battery":50,
            "fill":80,
            "location":{
            "latitude": 100,
            "longitude": 100
            },
            "weightDate": 2002-12-16 
        }
            }); 

    it('should validate object when correct weight', () => {
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeFalsy();

    });


    it('should not validate object when wrong weight', () => {
        object.bulkMobileCouponBindingModel[0].weight = 1600;        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeTruthy();
    });


     it('should validate object when correct bagCode', () => {
        object.bulkMobileCouponBindingModel[0].bagCode = 'test';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeFalsy();
    });


     it('should not validate object when wrong bagCode ', () => {
        object.bulkMobileCouponBindingModel[0].bagCode = 'testwrongtestwrong';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeTruthy();
    });

    
    it('should not validate object when enough battery ', () => {
        object.battery = '90';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeFalsy();
    });


    it('should not validate object when wrong battery ', () => {
        object.battery = '110';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeTruthy();
    });


    it('should not validate object when correct fill ', () => {
        object.fill = '90';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeFalsy();
    });


    it('should not validate object when wrong fill ', () => {
        object.fill = '110';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeTruthy();
    });


     it('should not validate object when correct latitude ', () => {
        object.location.latitude = '110';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeFalsy();
    });


     it('should not validate object when wrong latitude ', () => {
        object.location.latitude = '-190';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeTruthy();
    });


    it('should not validate object when wrong latitude ', () => {
        object.location.latitude = '380';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeTruthy();
    });
    

    it('should not validate object when correct longitude ', () => {
        object.location.longitude = '110';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeFalsy();
    });


     it('should not validate object when wrong longitude ', () => {
        object.location.longitude = '-190';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeTruthy();
    });


    it('should not validate object when wrong longitude ', () => {
        object.location.longitude = '380';        
        const result = weightsInstance.validateWeight(object);
        expect(result.error).toBeTruthy();
    });


});

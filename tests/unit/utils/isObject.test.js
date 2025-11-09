const isObject = require('../../../utils/isObject.js');


describe('Is Object util', () => {

    it('should return false for null input', () => {
        const result = isObject(null);
        expect(result).toBe(false);
    });

    it('should return false for not empty array  input', () => {
        expect(isObject(['a'])).toBe(false);
    });
    
    it('should return false for empty array  input', () => {
        expect(isObject([])).toBe(false);
    });
    
    it('should return true for non empty object input', () => {
        expect(isObject({a: 'ok'})).toBe(true);
    });
    
    it('should return true for non empty object input', () => {
        expect(isObject({a: 'ok'})).toBe(true);
    });
    
});
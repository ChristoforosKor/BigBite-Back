const isEmptyObject = require('../../../utils/isEmptyObject.js');


describe('Is Empty Object util', () => {

    it('should return true for null input', () => {
        expect(isEmptyObject(null)).toBe(true);
    });

    it('should return true for empty object input', () => {
        expect(isEmptyObject({})).toBe(true);
    });

    it('should return true for empty array input', () => {
        expect(isEmptyObject([])).toBe(true);
    });
    
     it('should return true for primitieve input', () => {
        expect(isEmptyObject(1)).toBe(true);
    });
    
    it('should return false for String input', () => {
        expect(isEmptyObject("a")).toBe(false);
    });
});
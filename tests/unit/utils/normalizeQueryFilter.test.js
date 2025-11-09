const normalizeQueryFilter = require('../../../utils/normalizeQueryFilter.js');


describe('Normalize Query Filter', () => {

    it('qs-parsed numeric-object with ANDs becomes an array', () => {
        const input = {
            '0': {'0': 'username', '1': 'contains', '2': 's.valis'},
            '1': 'and',
            '2': {'0': 'fullname', '1': 'contains', '2': 's'},
            '3': 'and',
            '4': {'0': 'organization.organizationName', '1': 'contains', '2': 'sd'}
        };

        expect(normalizeQueryFilter(input)).toEqual([
            ['username', 'contains', 's.valis'],
            'and',
            ['fullname', 'contains', 's'],
            'and',
            ['organization.organizationName', 'contains', 'sd']
        ]);
    });

    it('should parse JSON stringified object to array', () => {
        const input = JSON.stringify([
            ['username', 'contains', 's.valis'],
            'and',
            ['fullname', 'contains', 's']
        ]);
        const result = normalizeQueryFilter(input);
        expect(normalizeQueryFilter(input)).toEqual([
            ['username', 'contains', 's.valis'],
            'and',
            ['fullname', 'contains', 's']
        ]);
    });

    it('should parse and normalize JSON Stringified numeric-key object', () => {
        const input = JSON.stringify({
            '0': {'0': 'username', '1': 'contains', '2': 's'},
            '1': 'and',
            '2': {'0': 'email', '1': 'contains', '2': '@example.com'}
        });
        expect(normalizeQueryFilter(input)).toEqual([
            ['username', 'contains', 's'],
            'and',
            ['email', 'contains', '@example.com']
        ]);
    });

    it('should return null for non-numeric keyed object', () => {
        const input = {test: 'username', test2: 'contains', '2': 's.valis'};
        expect(normalizeQueryFilter(input)).toBeNull();
    });

    it('should recursevily proccess deeply nested numeric key object', () => {
        const input = {
            '0': {
                '0': 'username',
                '1': 'contains',
                '2': {'0': 'first', '1': 'last'}
            },
            '1': 'and',
            '2': {'0': 'age', '1': '>=', '2': '18'}
        };
        const result = normalizeQueryFilter(input);
        
        expect(result).toEqual([
                ['username', 'contains', ['first', 'last']],
                'and',
                ['age', '>=', '18']
        ]);
        
    });
    
    it('should fall back to single-item array for invalid JSON string', () => {
        expect(normalizeQueryFilter('["bad json"')).toEqual(['["bad json"']);
    });
});
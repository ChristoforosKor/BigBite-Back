const {mergeMongoFiltersAND} = require('../../../utils/mergeMongoFilters.js');

describe('And merging', () => {

    it('should return a query with two scales joined with and', () => {
        const sectA = {
            $or: [
                {createdBy: '6880d3e47810b26b251c2a23'},
                {user: '6880d3e47810b26b251c2a23'},
                {coOwners: {$in: ['6880d3e47810b26b251c2a23']}}
            ]
        };

        const sectB = {
            $and: [
                {mobile_phone: {$regex: '697'}},
                {'organization.organizationName': {$regex: 'MAINS'}},
                {username: {$regex: 'S.VALIS'}}
            ]
        };

        sectC =  {qr_code: { $in: ['q1', 'q2']}};
        const merged = mergeMongoFiltersAND([sectA, sectB, sectC]);
        expect(merged['$and'][0]).toEqual(sectA);
        expect(merged['$and'][1]).toEqual(sectB);
        expect(merged['$and'][2]).toEqual(sectC);
        expect(merged['$and'].length).toBe(3);
        console.log(JSON.stringify(merged, null,4));
    });

});
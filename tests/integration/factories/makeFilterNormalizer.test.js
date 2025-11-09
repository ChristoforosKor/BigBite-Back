const express = require('express');
const supertest = require('supertest');
const makeFilterNormalizer = require ( '../../../factories/makeFilterNormalizer.js');




function makeApp() {
    const sourceKey ='filter'; 
    const attachTo ='filters';
    const subKey = 'raw';
    const app = express();
    const rest = makeFilterNormalizer({sourceKey, attachTo, subKey});
    app.use(makeFilterNormalizer({sourceKey, attachTo, subKey}));
    app.get('/users', (req, res) => {
        res.json({
            filterArray: req[attachTo]?.[subKey] ?? null,
            rawQuery: req.query
        });
    });
    
    return app;
}

 describe('makeFilterNormalizer (integration)', () => {
    it ('should normalize qs-style nested on /user', async () => {
        const app = makeApp();
        const res = await supertest(app)
                .get('/users')
                .query({
                    'filter[0][0]': 'username',
                    'filter[0][1]': 'contains',
                    'filter[0][2]': 's.valis',
                    'filter[1]': 'and',
                    'filter[2][0]': 'fullname',
                    'filter[2][1]': 'contains',
                    'filter[2][2]': 's',
                    'filter[3]': 'and',
                    'filter[4][0]': 'organization.organizationName',
                    'filter[4][1]': 'contains',
                    'filter[4][2]': 'sd'
                }).expect(200);
                
                console.log(res.body.filterArray);
        expect(res.body.filterArray).toEqual([
           ['username', 'contains', 's.valis'],
           'and',
           ['fullname', 'contains', 's'],
           'and',
           ['organization.organizationName', 'contains', 'sd']
        ]);
        
        
        
    });
 });
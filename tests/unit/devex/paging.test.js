/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */

const request = require('supertest');
const config = require('config');
const transform = require('../../../dto/DevexPagingToMongoose')



describe('DevexPagingToMongoose', () => {
 
let data = { skip: 20 , take: 10}
    it('should use take and skip from query', async () => {
       const paging = transform(data);
        expect(paging.skip).toBe(20);
        expect(paging.limit).toBe(10);
    });
     it('should use take from configs pagesize and skip from query', async () => {
          data = { skip: 0}
       const paging = transform(data);
        expect(paging.skip).toBe(0);
        expect(paging.limit).toBe(20);
    });
     it('should use take from query and skip from paging options', async () => {
          data = { take: 10 }
       const paging = transform(data);
        expect(paging.skip).toBe(0);
        expect(paging.limit).toBe(10);
    });
        it('should use default with empty', async () => {
            data = { }
          const paging = transform(data);
            expect(paging.skip).toBe(0);
            expect(paging.limit).toBe(20);
    });
     it('should use default with incorrect keys', async () => {
            data = { offset : 20, limit : 10  }
          const paging = transform(data);
            expect(paging.skip).toBe(0);
            expect(paging.limit).toBe(20);
    });
    
});




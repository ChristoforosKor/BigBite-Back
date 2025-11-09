/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */


const config = require('config');
const pager = require('../lib/pager');
const transform = require('../dto/DevexPagingToMongoose.js');

module.exports = async (req, res, next) => {
    let data = {};
    
    if (req.query.take){
        data.take =  req.query.take;
    }
    if (req.query.skip &&  req.query.skip != 0 ) {
         data.skip =  req.query.skip;
    }
    console.log(data);
    let paging = transform(data);

      req.paging = paging;

    next();
}; 
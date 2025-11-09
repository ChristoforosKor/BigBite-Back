/**
 * Tranforms paging paramters from Devextreme data table request to 
 * mongoose aware paging params.
 */
const config = require('config');
const pager = require('../lib/pager');

const transform = (data) => {
    pagingOptions = {};
    
    
    if (data.take){
        pagingOptions.pageSize = data.take;
    }
    if (data.skip ) {
        pagingOptions.pageNumber = Math.floor(data.skip/pagingOptions.pageSize);
    }
    let paging = pager.options(pagingOptions);
        
       return paging;
//    req.paging = paging;
//   
//    next();
}; 


module.exports = transform;

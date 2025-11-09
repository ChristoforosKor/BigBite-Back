
module.exports.checkMobile = (req) => {
   const  useragent = req.useragent;
   if(useragent.isMobile || useragent.isMobileNative||  useragent.isTablet)
    return true;
   else{
       return false;
   }
}
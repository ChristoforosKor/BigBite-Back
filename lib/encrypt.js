 const crypto = require('crypto');
 const iterations = 1000;
 const hashLength = 64;
 const algorithm = 'sha256';
  
  
  
  module.exports.hashWithNewSalt = async (content) => {
    
    const salt = await crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(content, salt, iterations, hashLength, algorithm).toString('hex');    
    return {
        salt: salt,
        hash: hash 
    };
  };
  

  
  /**
   * 
   * @param {String} toValidate Unhashed string that we want to check.
   * @param {String} hash Hashed value that we use for check @toValidate
   * @param {String} salt The salt we use on hash
   * @returns {unresolved}
   */
  module.exports.validHashWithSalt = (toValidate, hash, salt) => {
      const toCheck =  crypto.pbkdf2Sync(toValidate, salt, iterations, hashLength, algorithm).toString('hex');
      return hash === toCheck;
  };
  
//  module.exports.hash = async (data) => {
//    const salt = await bcrypt.genSalt(10);
//    return await bcrypt.hash(data, salt);
//  };
    
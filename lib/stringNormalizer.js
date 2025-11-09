
const normalizeString= (value) => {
  if (typeof value !== "string") return value; 


  let upper = value.toUpperCase();

  let normalized = upper.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return normalized;
};

const isObjectId = (str) => /^[a-fA-F0-9]{24}$/.test(str);


const stringNormalizer =  (obj) => {
    const normalizedObj = {};
    const excludeFields= ["username", "password", "code", "coupon_code", "group_code", "organizationSiteURL", "organizationLogo", "passwordAgain", "confirmedMail", "organizationType", "qr_code_svg"]
      for (const [key, value] of Object.entries(obj)) {
        if (excludeFields.includes(key)) {
                    normalizedObj[key] = value;
        }else if (typeof value === "string" && !isObjectId(value)) {
            normalizedObj[key] = normalizeString(value);
        } else {
            normalizedObj[key] = value;
          }
      }

      return normalizedObj;
   };

module.exports.stringNormalizer = stringNormalizer;
module.exports.normalizeString = normalizeString;
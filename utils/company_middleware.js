const User = require("../models/userModel");

const getCompanyID = async(req) => {
    var token = req?.headers?.token
    if (token === null){
        return null;
    }
    let user = null;
    let company_id = null;
    try {
      user = await User.findOne({ _id: token });
      company_id = user.company_id;
      return company_id;
    } catch (err) {
        return null;
    }
}

module.exports.getCompanyID = getCompanyID;
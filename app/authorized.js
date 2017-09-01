const tools= require('./tools');
const jwt = require('jwt-simple');

exports.isAuthorized = function (header, uid) {
    token = header.split(" ")[1];
    secret = tools.secret;
    decoded = jwt.decode(token, secret, false, 'HS256');
    if (decoded.userID == uid){
        return true;
    }else{
        return false;
    }
}


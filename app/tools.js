const randomstring = require("randomstring");

const secret = randomstring.generate();
exports.secret = secret;

const refreshToken = randomstring.generate();
exports.refreshToken = refreshToken;

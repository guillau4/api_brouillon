const express = require('express');
const router = express.Router();
const pg = require('pg');
const bcrypt = require('bcrypt-nodejs');
const jwtBuilder = require('jwt-builder');
const tools= require('./tools');
const moment = require('moment');
const randomstring = require("randomstring");
const uuidc4 = require("uuid/v4");

const config = {
    user: 'Laure',
    password: 'laure',
    database: 'test',
}

/*Function: login
Recieve a post request from server and call the right login function depending on the parameters inside the request body.

*Post parameters :*

- email

- password

- uuid

or

- refreshtoken


See Also:

    <loginWithoutRefreshToken>
    <loginWithRefreshToken>
 */

router.post('/login',function login(req,res,next){
    if(req.body.email!=null){
        loginWithoutRefreshToken(req, res, next);
    } else{
        loginWithRefreshToken(req, res, next);
    }
})


/*Function: loginWithoutRefreshToken
Check mail and password and send a created a token and refreshtoken

See Also:

    <login>
 */
function loginWithoutRefreshToken (req,res,next) {
    const data = {email: req.body.email, password: req.body.password, uuid: req.body.uuid}
    const pool = pg.Pool(config);
    pool.connect(function (err, client, done) {
        if (err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err}).end();
        } else {
            client.query('SELECT * FROM users WHERE email = $1', [data.email],
                function (error, result) {
                    if (error) {
                        console.log(error);
                        done();
                        return res.status(500).json({success: false, data: error, code: 500}).end();
                    } else if (result.rows[0] == null) {
                        console.log("Email not valid");
                        done();
                        return res.status(500).json({success: false, data: error, code: 1}).end();
                    } else {
                        bcrypt.compare(data.password, result.rows[0].password, function (err, isMatched) {
                                if (err) throw err
                                else if (isMatched == false) {
                                    console.log("Password not valid");
                                    done();
                                    return res.status(500).json({success: false, data: error, code: 1}).end();
                                } else if (result.rows[0].status == 2) {
                                    console.log("Account not validate");
                                    done();
                                    return res.status(500).json({success: false, data: error, code: 2}).end();
                                } else if (result.rows[0].status == 3) {
                                    console.log("Account blocked");
                                    done();
                                    return res.status(500).json({success: false, data: error, code: 3}).end();
                                } else if (result.rows[0].status == 4) {
                                    console.log("Need to activate account");
                                    done();
                                    return res.status(500).json({success: false, data: error, code: 4}).end();
                                } else {
                                    var date = moment().valueOf();
                                    var uid = result.rows[0].uid;
                                    var jwtToken = jwtBuilder({
                                        iat: date,
                                        uuid: data.uuid,
                                        secret: tools.secret
                                    })
                                    var refreshToken = randomstring.generate();
                                    client.query('UPDATE refreshtoken SET token = $1 where uid = $2',
                                        [refreshToken, result.rows[0].uid],
                                        function (error, result2) {
                                            if (error) {
                                                console.log(error);
                                                done();
                                                return res.status(500).json({
                                                    success: false,
                                                    data: error,
                                                    code: 500
                                                }).end();
                                            } else {
                                                client.query("UPDATE users SET uuid = $1 where uid = $2",
                                                    [data.uuid, result.rows[0].uid],function (error, result) {
                                                        if (error) {
                                                            console.log(error);
                                                            done();
                                                            return res.status(500).json({
                                                                success: false,
                                                                data: error,
                                                                code: 500
                                                            }).end();
                                                        } else {
                                                            done();
                                                            return res.status(200).json({
                                                                success: true,
                                                                access_token: jwtToken,
                                                                user_uid: uid,
                                                                refresh_token: refreshToken,
                                                                expires_in: 100000
                                                            }).end();
                                                        }
                                                    }
                                                )
                                            }
                                        }
                                    )
                                }
                            }
                        )
                    }
                }
            )
        }
    })
}


/*Function: loginWithRefreshToken
Check refreshtoken and send a new token

See Also:

    <login>
 */
function loginWithRefreshToken (req,res,next) {
    //Get data from the http request
    const data = {refreshToken: req.body.refresh_token}
    const pool = pg.Pool(config);
    pool.connect(function (err, client, done) {
            if (err) {
                done();
                console.log(err);
                return res.status(500).json({success: false, data: err}).end();
            } else {
                client.query('SELECT * FROM refreshtoken WHERE token = $1', [data.refreshToken],
                    function (err, result) {
                        if (err) throw err;
                        else if (result.rows[0] == null) {
                            console.log("Token not valid");
                            return res.status(500).json({success: false, data: "Token not valid", code: 500}).end();
                        } else {
                            var date = moment().valueOf();
                            var jwtToken = jwtBuilder({
                                iat: date,
                                userID: result.rows[0].uuid,
                                secret: tools.secret
                            })
                            done();
                            return res.status(200).json({
                                success: true,
                                access_token: jwtToken,
                                refresh_token: data.refreshToken,
                                expires_in: 100000
                            }).end();
                        }
                    }
                )
            }
        }
    )
}

module.exports =router;
const express = require('express');
const router = express.Router();
const pg = require('pg');
const bcrypt = require('bcrypt-nodejs');
const jwtBuilder = require('jwt-builder');
const tools= require('./tools');
const moment = require('moment');
const randomstring = require("randomstring");

const config = {
    user: 'Laure',
    password: 'laure',
    database: 'test',
}

const connectionString = 'postgres://Laure:laure@localhost:5432/test';



router.post('/login',function(req,res,next){
    if(req.body.email!=null){
        loginWithoutRefreshToken(req, res, next);
    } else{
        console.log(req.body.refresh_token)
        loginWithRefreshToken(req, res, next);
    }
})

function loginWithoutRefreshToken (req,res,next) {
    //Get data from the http request
    const data ={email: req.body.email, password: req.body.password, uuid : req.body.uuid}
    const pool = pg.Pool(config);
    pool.connect(function (err, client, done) {
            if (err) {
                done();
                console.log(err);
                return res.status(500).json({success: false, data: err}).end();
            } else {
                //Test if mail address already exists
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
                                        console.log("ok");
                                        var date = moment().valueOf();
                                        var jwtToken = jwtBuilder({
                                            iat: date,
                                            userID: data.uuid,
                                            secret: tools.secret
                                        })
                                        console.log(jwtToken)
                                        var refreshToken = randomstring.generate();
                                        client.query('INSERT INTO refreshtoken (token,uuid) values ($1, $2)',
                                            [refreshToken, data.uuid],
                                            function (error, result) {
                                                if (error) {
                                                    console.log(error);
                                                    done();
                                                    return res.status(500).json({success: false, data: error, code: 500}).end();
                                                } else {
                                                    done();
                                                    return res.status(200).json({
                                                        success: true,
                                                        access_token: jwtToken,
                                                        user_uid: data.uuid,
                                                        refresh_token: refreshToken,
                                                        expires_in: 600000
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

function loginWithRefreshToken (req,res,next) {
    //Get data from the http request
    const data ={refreshToken: req.body.refresh_token}
    const pool = pg.Pool(config);
    pool.connect(function (err, client, done) {
            if (err) {
                done();
                console.log(err);
                return res.status(500).json({success: false, data: err}).end();
            } else {
                console.log(data.refreshToken)
                //Test if mail address already exists
                client.query('SELECT * FROM refreshtoken WHERE token = $1', [data.refreshToken],
                    function (err, result) {
                        if (err) throw err;
                        else if (result.rows[0] == null) {
                            console.log("Token not valid");
                            return res.status(500).json({success: false, data:"Token not valid", code: 500}).end();
                        } else {
                            var date = moment().valueOf();
                            var jwtToken = jwtBuilder({
                                iat: date,
                                userID: data.uuid,
                                secret: tools.secret
                            })
                            var refreshToken = randomstring.generate();
                            client.query('UPDATE refreshtoken SET token = $1 where token = $2',
                                [refreshToken, data.refreshToken],
                                function (error, result) {
                                    if (error) {
                                        console.log(error);
                                        done();
                                        return res.status(500).json({success: false, data: error, code: 500}).end();
                                    } else {
                                        done();
                                        return res.status(200).json({
                                            success: true,
                                            access_token: jwtToken,
                                            user_uid: data.uuid,
                                            refresh_token: refreshToken,
                                            expires_in: 600000
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

module.exports =router;
const express = require('express');
const router = express.Router();
const pg = require('pg');
const path = require('path');
const bcrypt = require('bcrypt-nodejs');
const uuidv4 = require("uuid/v4");

const config = {
    user: 'Laure',
    password: 'laure',
    database: 'test',
}

const connectionString = 'postgres://Laure:laure@localhost:5432/test';


router.post('/sign_up', (req,res,next)=> {
    const results = [];
    //Get data from the http request
    const data = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        password: req.body.password
    }
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
                    } else if (result.rows[0] != null) {
                        console.log("Mail address already exists in Database");
                        done();
                        return res.status(409).json({
                            success: false,
                            data: "Mail address already exists in Database",
                            code: 409
                        }).end();
                    } else {
                        //hash password
                        bcrypt.genSalt(10, function(err, salt) {
                            if (err) return; //handle error
                            bcrypt.hash(data.password, salt, null, function (err, hash) {
                                if (err) return;
                                //Insert user query
                                client.query('INSERT INTO  users(uid, firstname, lastname, email, password, status) values ($1, $2, $3, $4, $5, 2)',
                                    [uuidv4(),data.firstname, data.lastname, data.email, hash],
                                    function (error, result) {
                                        if (error) {
                                            console.log(error);
                                            done();
                                            return res.status(500).json({success: false, data: error, code: 500}).end();
                                        } else {
                                            done();
                                            return res.status(201).json({success: true, data: "ok", code: 201}).end();
                                        }
                                    })
                                })
                        })
                    }
                }
            )
        }
    })
})

router.get('/sign_up/:userUID', (req,res,next)=> {
//Get data from the http request
const pool = pg.Pool(config);
pool.connect(function (err, client, done) {
        if (err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err}).end();
        } else {
            uid = req.params.userUID;
            client.query('SELECT * FROM users WHERE uid = $1 ', [uid],
            function (error, result) {
                if (error) throw error;
                else {
                    done();
                    return res.status(201).json(
                        {
                            success: true,
                            uid: result.rows[0].uid,
                            last_name : result.rows[0].lastname,
                            first_name : result.rows[0].firstname,
                            email: result.rows[0].email,
                            password: result.rows[0].password,
                            status: result.rows[0].status
                        });
                    }
                }
            )
        }
    })
})



module.exports =router;
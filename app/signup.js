const express = require('express');
const router = express.Router();
const pg = require('pg');
const bcrypt = require('bcrypt-nodejs');
const uuidv4 = require("uuid/v4");
const authorised = require("./authorized")
const profileUpdate = require("./profileUpdate")

const config = {
    user: 'Laure',
    password: 'laure',
    database: 'test',
}

/*Function: sign_up
Add a user to the database with all his user details and create a corresponding user ID. His mail adress must not exist beforehand in the database.

*Post parameters :*

- firstname

- lastname

- email

- password

See Also:
<login>
 */

router.post('/sign_up', function sign_up(req,res,next) {
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
                                uid=uuidv4();
                                client.query('INSERT INTO  users(uid, firstname, lastname, email, password, status) values ($1, $2, $3, $4, $5,1)',
                                    [uid,data.firstname, data.lastname, data.email, hash],
                                    function (error, result) {
                                        if (error) {
                                            console.log(error);
                                            done();
                                            return res.status(500).json({success: false, data: error, code: 500}).end();
                                        } else {
                                            client.query('INSERT INTO refreshtoken(token,uid) values (0, $1)',
                                                [uid],
                                                function (error, result) {
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
                                                        return res.status(201).json({
                                                            success: true,
                                                            data: "ok",
                                                            code: 201
                                                        }).end();
                                                    }
                                                }
                                                )
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


/*Function: getUser
Get the personnal information of a user .

*Post parameter :*

- token

*URL parameter :*

- userUID

See Also:
<modifyUser>
 */
router.get('/sign_up/:userUID', function getUser(req,res,next){
    uid = req.params.userUID;
    header = req.headers['x-authorization'];
    authorised.isAuthorized(header,uid, function (cb) {
        if (cb == true) {
            const pool = pg.Pool(config);
            pool.connect(function (err, client, done) {
                if (err) {
                    done();
                    console.log(err);
                    return res.status(500).json({success: false, data: err}).end();
                } else {
                    client.query('SELECT * FROM users WHERE uid = $1 ', [uid],
                        function (error, result) {
                            if (error) {
                                throw error;
                                done();
                                return res.status(500).json({success: false, data: error}).end();
                            }
                            else {
                                done();
                                return res.status(201).json(
                                    {
                                        success: true,
                                        uid: result.rows[0].uid,
                                        last_name: result.rows[0].lastname,
                                        first_name: result.rows[0].firstname,
                                        email: result.rows[0].email,
                                        password: result.rows[0].password,
                                        status: result.rows[0].status
                                    });
                            }
                        }
                    )
                }
            })
        } else {
            return res.status(500).json({success: false, data: "authorization denied"}).end();
        }
    })
})



/*Function: modifyUser
Get the personnal information of a user .

*Put parameter :*

- fisrtname

- lastname

- email

or

- password

*URL parameter :*

- userUID

See Also:
<getUser>
<updateUser>
<updatePassword>
 */

router.put('/sign_up/:userUID', function modifyUser(req,res,next){
    uid = req.params.userUID;
    header = req.headers['x-authorization'];
    cb = authorised.isAuthorized(header,uid, function (cb) {
        if (cb == true) {
            const pool = pg.Pool(config);
            pool.connect(function (err, client, done) {
                if (err) throw err;
                else {
                    if (req.body.email && req.body.first_name && req.body.last_name) {
                        profileUpdate.updateUser(req.body.email, req.body.first_name, req.body.last_name, uid, client, function (result) {
                                if (result == 1) {
                                    done();
                                    return res.status(200).json({success: true, data: "ok"}).end();
                                } else if (result == 2) {
                                    done();
                                    return res.status(409).json({
                                        success: false,
                                        data: "mail already exists",
                                        code: 409
                                    }).end();
                                } else {
                                    done();
                                    return res.status(500).json({success: false, data: "update error"}).end();
                                }
                            }
                        )
                    } else if (req.body.password) {
                        profileUpdate.updatePassword(req.body.password, uid, client, function (result) {
                                if (result == true) {
                                    done();
                                    return res.status(200).json({success: true, data: "ok"}).end();
                                } else {
                                    done();
                                    return res.status(500).json({success: false, data: "update error"}).end();
                                }
                            }
                        )
                    } else {
                        done();
                        return res.status(500).json({success: false, data: "param not valid"}).end();
                    }
                }
            })
        } else {
            done();
            return res.status(500).json({success: false, data: "authorization denied"}).end();
        }
    }
    )
})



module.exports =router;
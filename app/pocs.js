const express = require('express');
const router = express.Router();
const pg = require('pg');
const path = require('path');
const authorised = require("./authorized");

const config = {
    user: 'Laure',
    password: 'laure',
    database: 'test',
}


router.get('/pocs/:userUID',function getPocs(req,res,next){
    uid = req.params.userUID;
    header = req.headers['x-authorization'];
    cb = authorised.isAuthorized(header,uid, function (cb) {
        if (cb == true) {
            const pool = pg.Pool(config);
            pool.connect(function (err, client, done) {
                if (err) {
                    done();
                    console.log(err);
                    return res.status(500).json({success: false, data: err}).end();
                } else {
                    //Test if mail address already exists
                    client.query('SELECT mac,status,lastseen FROM sondes',
                        function (error, result) {
                            if (error) {
                                console.log(error);
                                done();
                                return res.status(500).json({success: false, data: error, code: 500}).end();
                            } else {
                                str = JSON.stringify(result.rows)
                                var data = JSON.parse(str);
                                for (var i in data) {
                                    data[i].favorite = 'false';
                                }
                                json_result = JSON.stringify(data);
                                console.log(json_result)
                                return res.status(201).json(json_result).end();
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

module.exports =router;
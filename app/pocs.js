const express = require('express');
const router = express.Router();
const pg = require('pg');
const path = require('path');
const authorised = require("./authorized");
const favorite = require("./favorite");

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
                    client.query('SELECT id,mac,status,lastseen FROM sondes',
                        function (error, result) {
                            if (error) {
                                console.log(error);
                                done();
                                return res.status(500).json({success: false, data: error, code: 500}).end();
                            } else {
                                str = JSON.stringify(result.rows)
                                var data = JSON.parse(str);
                                for (var i in data) {
                                    data[i].favorite = "false"
                                }
                               favorite.getFavorite(uid, client, function (response) {
                                    for (var i in response){
                                        data[response[i].sonde_id].favorite = "true";
                                    }
                                    json_result = JSON.stringify(data);
                                    console.log(json_result)
                                    done();
                                    return res.status(201).json(json_result).end();
                               }
                               )
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

router.post('/pocs/:userUID',function changeFavorite(req,res,next) {
    uid = req.params.userUID;
    const data = {
        id: req.body.uid,
        favorite: req.body.favorite
    }
    const pool = pg.Pool(config);
    pool.connect(function (err, client, done) {
        if (err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err}).end();
        } else {
            if (data.favorite){
                client.query('DELETE FROM favorite WHERE user_uid = $1 AND sonde_id = $2',
                    [uid, data.id],
                    function (error, result) {
                        if (error) {
                            console.log(error);
                            done();
                            return res.status(500).json({success: false, data: error, code: 500}).end();
                        } else {
                            return res.status(200).json({success: true, data: "ok", code: 201}).end();
                        }
                    })
            }else{
                client.query('INSERT INTO favorite(user_uid,sonde_id) VALUES ($1,$2)',
                    [uid, data.id],
                    function (error, result) {
                        if (error) {
                            console.log(error);
                            done();
                            return res.status(500).json({success: false, data: error, code: 500}).end();
                        } else {
                            return res.status(200).json({success: true, data: "ok", code: 201}).end();
                        }
                    }
                )
            }
        }
    })
})


module.exports =router;
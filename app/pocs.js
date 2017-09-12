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
                               favorite.getFavorite(uid, client, data, function (response) {
                                    for (var i in data){
                                        sonde_id = data[i].mac;
                                        for (var j in response){
                                            if (sonde_id==response[j].sonde_id) {
                                                data[i].favorite = 'true';
                                            }
                                        }
                                        if (!data[i].favorite){
                                            data[i].favorite = 'false';
                                        }
                                    }
                                    json_result = JSON.stringify(data);
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
            done()
            return res.status(500).json({success: false, data: "authorization denied"}).end();
        }
    })
})

router.put('/pocs/:userUID',function changeFavorite(req,res,next) {
    uid = req.params.userUID;
    const data = {
        id: req.body.poc.uid,
        favorite: req.body.poc.favorite
    }
    const pool = pg.Pool(config);
    pool.connect(function (err, client, done) {
        if (err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err}).end();
        } else {
            if (data.favorite == 'true'){
                client.query('DELETE FROM favorite WHERE user_uid = $1 AND sonde_id = $2',
                    [uid, data.id],
                    function (error, result) {
                        if (error) {
                            console.log(error);
                            done();
                            return res.status(500).json({success: false, data: error, code: 500}).end();
                        } else {
                            done();
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
                            done();
                            return res.status(200).json({success: true, data: "ok", code: 201}).end();
                        }
                    }
                )
            }
        }
    })
})

router.get('/pocs/favorite/:userUID',function getFavorite(req,res,next){
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
                    client.query('SELECT * FROM sondes WHERE mac in (SELECT sonde_id FROM favorite WHERE user_uid = $1)',
                        [uid],
                        function (error, result) {
                        if (error) {
                            console.log(error);
                            done();
                            return res.status(500).json({success: false, data: error, code: 500}).end();
                        } else {
                            str = JSON.stringify(result.rows);
                            var data = JSON.parse(str);
                            console.log(data)
                            json_result = JSON.stringify(data);
                            done();
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
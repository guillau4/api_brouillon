const express = require('express');
const router = express.Router();
const pg = require('pg');
const path = require('path');

const config = {
    user: 'Laure',
    password: 'laure',
    database: 'test',
}

const connectionString = 'postgres://Laure:laure@localhost:5432/test';

router.post('/api/sign_up', (req,res,next)=> {
    const results = [];
    //Get data from the http request
    console.log(req.body)
    const data ={name: req.body.name, lastname: req.body.lastname, mail: req.body.mail}
    const pool = pg.Pool(config);
    pool.connect(function (err, client, done) {
        if (err){
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err });
        }
        //Insert user query
        client.query('INSERT INTO  users(name, lastname, mail) values ($1, $2, $3)',
            [data.name, data.lastname, data.mail],
            function (error,result) {
                if(error){
                    console.log(error);
                    return result.status(500).json({success: false, data: error});
                }
            });
            done();
            console.log("ok")
            return res.status(201);
    });
});
module.exports =router;
const express = require('express');
const router = express.Router();
const pg = require('pg');

const config = {
    user: 'Laure',
    password: 'laure',
    database: 'test',
}

const connectionString = 'postgres://Laure:laure@localhost:5432/test';



router.post('/login',(req,res,next)=> {
    const results = [];
    //Get data from the http request
    const data ={email: req.body.email, password: req.body.password, uuid : this.uuid}
    const pool = pg.Pool(config);
    pool.connect(function (err, client, done) {
        if (err){
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err }).end();
        }else {
            //Test if mail address already exists
            client.query('SELECT * FROM users WHERE email = $1 AND password = $2', [data.email, data.password],
                function (error, result) {
                    if (error) {
                        console.log(error);
                        done();
                        return res.status(500).json({success: false, data: error, code:500}).end();
                    }else if (result.rows[0]==null ){
                        console.log("Password or email not valid");
                        done();
                        return res.status(500).json({success: false, data: error, code:1}).end();
                    }else{
                        done();
                        return res.status(200).json({success: true, data: "ok", code:200}).end();
                    }
                });
        }
    });
});

module.exports =router;
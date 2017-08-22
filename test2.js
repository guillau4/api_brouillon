// Dependencies
var express = require('express');
var bodyParser = require('body-parser');

// Express
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.PORT ||3000;

var pg =require('pg');
pg.connect('postgres://Laure:laure@localhost:5432/test',(err,,client,done){
if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

var user = require('./app/users');

var router = express.Router();

router.use(function(req, res, next) {
	console.log('Something is happening.');
	next();
});

//-------------- Users route-----------------
router.route('/users')

    
    .post(function(req, res) {
    
        user.name = req.body.name;  
        user.lastname = req.body.lastname;
		user.mail = req.body.mail;
		
        user.save(function(err) {
            if (err)
                res.status(500);

            res.status(201);
        });

    });


	
app.use('/api', router);

app.listen(port);
console.log('Magic happens on port ' + port);
})
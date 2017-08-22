const pg = require ("pg");

const config = {
	user: 'Laure',
	password: 'laure',
	database: 'test',
	}
const pool = new pg.Pool(config);
pool.connect(function (err,client,done) {
	if (err) console.log(err);
	var myClient= client;
	myClient.query("CREATE TABLE items(id SERIAL PRIMARY KEY, text VARCHAR(8), number INTEGER)", function(err){
		if (err) {
					console.log(err);
				}
	});
	done();
});
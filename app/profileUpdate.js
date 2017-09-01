const pg = require('pg');

const config = {
    user: 'Laure',
    password: 'laure',
    database: 'test',
}

const connectionString = 'postgres://Laure:laure@localhost:5432/test';



exports.updateUser = function(email,firstname,lastname,uid,success){
    const pool = pg.Pool(config);
    return pool.connect(function (err, client, done) {
        if (err) throw err;
        else {
            return client.query('UPDATE users SET email = $1, firstname = $2, lastname = $3 where uid = $4',
                [email,firstname,lastname,uid],
                function (error, result,success) {
                    if (error) {
                        throw error
                        done();
                        return false;
                    } else {
                        console.log("ok")
                        done();
                        return true;
                    }
                }
            )
        }
    })
}
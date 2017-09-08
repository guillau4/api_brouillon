const tools= require('./tools');
const jwt = require('jwt-simple');
const pg = require('pg');

const config = {
    user: 'Laure',
    password: 'laure',
    database: 'test',
}


/*Function: isAuthorized
Test if the token contained in the request header is valid

See Also:
    <login>
 */
exports.isAuthorized = function (header,uid,callback) {
    token = header.split(" ")[1];
    secret = tools.secret;
    decoded = jwt.decode(token, secret, false, 'HS256');
    const pool = pg.Pool(config);
    return pool.connect(function (err, client, done) {
        if (err) {
            done();
            console.log(err);
            return callback(false)
        } else {
            return client.query('SELECT uuid FROM users WHERE uid = $1 ', [uid],
                function (error, result) {
                    if (error) {
                        done();
                        console.log(err);
                        return callback(false)
                    } else {
                        if (decoded.uuid == result.rows[0].uuid) {
                            return callback(true);
                        } else {
                            return callback(false);
                        }
                    }
                }
            )
        }
    })
}


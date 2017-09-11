const pg = require('pg');


exports.getFavorite= function(user_uid, client, callback){
    return client.query('SELECT * FROM favorite WHERE user_uid = $1 ',
        [user_uid], function (err, response) {
            if (err) {
                throw err
            } else {
                str = JSON.stringify(response.rows)
                result = JSON.parse(str)
                return callback(result);
            }
        }
    )
}
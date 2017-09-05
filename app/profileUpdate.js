const pg = require('pg');
const bcrypt = require('bcrypt-nodejs');

/*Function: updateUser
Change user information in database

See Also:
    <modifyUser>
 */
exports.updateUser = function (email,firstname,lastname,uid,client,callback){
    return client.query('SELECT uid FROM users WHERE email = $1',
        [email],
        function (err,res) {
        if (err) {
            throw err
            return callback(3)
        }else if(res.rows[0].uid!=uid){
            return callback(2)
        }else{
            return client.query('UPDATE users SET email = $1, firstname = $2, lastname = $3 where uid = $4',
                [email,firstname,lastname,uid],
                function (error, result) {
                    if (error) {
                        throw error
                        return callback(3)
                    } else {
                        return callback(1)
                    }
                }
            )
        }
    })
}

/*Function: updateUser
Change user password in database

See Also:
    <modifyUser>
 */
exports.updatePassword = function (password,uid,client,callback){
    return bcrypt.genSalt(10, function(err, salt) {
        if (err) {
            return callback(false);
        } else { //handle error
            return bcrypt.hash(password, salt, null, function (err, hash) {
                if (err) {
                    return callback(false);
                } else {
                    return client.query('UPDATE users SET password = $1',
                        [hash],
                        function (error, result) {
                            if (error) {
                                throw error
                                return callback(false)
                            } else {
                                return callback(true)
                            }
                        }
                    )
                }
            })
        }
    })
}


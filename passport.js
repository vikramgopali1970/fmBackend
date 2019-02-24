const JwtStrategy   = require('passport-local').Strategy;
ExtractJwt = require('passport-jwt').ExtractJwt;
const sql = require('./database/sqlwrapper');

module.exports = function(passport){
    passport.use('login', new JwtStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) {
        console.log("qutwfeuqw",username, password);
            sql.execute([`select * from ilance_users where username="${username}"`]).then(data=>{
                if(data[0].length > 0){
                    done(null,data[0][0]);
                }else{
                    done(null,false);
                }
            }).catch(error=>{
                console.log(error);
                done(null,false);
            })
        })
    );
};
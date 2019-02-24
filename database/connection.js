const mysql = require('mysql');
const config = require('../database/config');
const pool = mysql.createPool(config.props);

let getConnection = (cb)=>{
    pool.getConnection((error,connection)=>{
        if(error){
            return cb(error);
        }
        cb(error,connection);
    });
};

module.exports  = getConnection;
module.exports = {
    props:{
        connectionLimit : 10,
        host     : process.env.DBHOST,
        user     : process.env.DBUSER,
        password : process.env.DBPASS,
        database : "outsource",//process.env.DBNAME,
        debug    :  false
    }

};
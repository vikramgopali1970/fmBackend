const MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017/myproject';
let _db;
// Use connect method to connect to the server

module.exports = {

    connectToServer: function( callback ) {
        MongoClient.connect( "mongodb://localhost:27017/marankings", function( err, db ) {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            _db = db;
            return callback( err );
        } );
    },

    getDb: function() {
        return _db;
    }
};
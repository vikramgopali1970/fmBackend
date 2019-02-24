const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const router = express.Router();
const md5 = require('md5');
const sql = require('./database/sqlwrapper');
const uuid = require('uuid/v4');
const session = require('express-session');
const moment = require('moment');
const jwt = require('jwt-simple');
const passport = require('passport');
const mongoUtil = require('./database/MongoDB');


mongoUtil.connectToServer( function( err ) {
    // start the rest of your app here
} );
//Route files require
const homeRoute = require('./routes/home');


const app = express();
app.use(express.json());

//Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
app.use(bodyParser.json({limit:'1mb'}));
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(session({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());
//logging the HTTPS requests
app.use(logger('dev'));

//to avoid CORS failure from chrome
const allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Expose-Headers', 'X-Api-Version, X-Request-Id, X-Response-Time');
    res.setHeader('Access-Control-Max-Age', '1000');
    next();
};

app.use(allowCrossDomain);

passport.serializeUser(function(user, done) {
    delete user["password"];
    delete user["salt"];
    delete user["secretquestion"];
    delete user["secretanswer"];
    done(null, user);
});

passport.deserializeUser(function(id, done) {
    done(null,id);
});


//list of the routes
app.use('/',homeRoute(router,sql,md5,moment,jwt));

module.exports = app;
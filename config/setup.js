require('dotenv').config();
var path         = require('path');
var express      = require('express');
var passport     = require('passport');
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose     = require('mongoose');
var session      = require('express-session');
var MongoStore   = require('connect-mongo')(session);

module.exports = function(app, base) {

	var ip   = process.env.IP   || '127.0.0.1';
	var port = process.env.PORT || 8080;
	
	// Mongoose setup
	mongoose.Promise = global.Promise;

	mongoose.connect('mongodb://' + ip + '/bookTradingAppDB');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
	    console.log('Connected to bookTradingAppDB');
	});

	// Close MongoDB connection
	process.on('SIGINT', function() {  
	    db.close(function () { 
	        console.log('Closing connection to votingAppDB'); 
	        process.exit(0); 
	    }); 
	});

	// Error Handler
	app.use(function(err, req, res, next) {
	    console.log(err)
	    res.status(err.status || 500).send(err)
	});

	app.use(cookieParser());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	require('./passport')(passport, ip, port);

	app.use(session({
	    secret: process.env.sessionSecret,
	    resave: true,
	    store : new MongoStore({
	        mongooseConnection: mongoose.connection
	    }),
	    saveUninitialized: true
	}));

	app.use(passport.initialize());
	app.use(passport.session());

	// all environments
	app.use(express.static(path.join(base, 'public')));
}
require('dotenv').config();
var path         = require('path');
var express      = require('express');
var passport     = require('passport');
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose     = require('mongoose');
var session      = require('express-session');
var MongoStore   = require('connect-mongo')(session);

var app = module.exports = express();

// Config
var ip           = process.env.IP   || '127.0.0.1';
var port         = process.env.PORT || 8080;
mongoose.Promise = global.Promise;

// TODO: Add Database clean up of old reservations

// Mongoose setup
mongoose.connect('mongodb://' + ip + '/bookTradingAppDB');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to bookTradingAppDB');
});

require('./config/passport')(passport, ip, port);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
app.use(express.static(path.join(__dirname, 'public')));

// Routes
require('./routes/index')(app);
require('./routes/auth')(app, passport);
require('./routes/api')(app);

// Catch all for AngularJS html5mode
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, './views/index.html'))
});

// Server Start
app.listen(port, function() {
  console.log('Listening on port', port);
});

// Close MongoDB connection
process.on('SIGINT', function() {  
  db.close(function () { 
    console.log('Closing connection to votingAppDB'); 
    process.exit(0); 
  }); 
});
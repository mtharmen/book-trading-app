require('dotenv').config();
var path     = require('path');
var http     = require('http');
var app      = require('express')();

// Setup
require('./config/setup')(app, __dirname);

// Routes
require('./routes/auth')(app);
require('./routes/api')(app);
require('./routes/index')(app);

// Server Start
const port  = process.env.PORT || 8080;

http.createServer(app).listen(port, function() {
    console.log('Listening on port', port);
});
var LocalStrategy = require('passport-local').Strategy;
require('dotenv').config();

var User = require('../config/models/user');

module.exports = function(passport, ip, port) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

  // LOCAL
    passport.use('local-login', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true,
        session : true
    },
    function(req, username, password, done) {

        var query = {};

        if (username.indexOf('@') < 0) {
            query = { username : username };
        } else {
            query = { 'local.email' : username.toLowerCase() };
        }

        process.nextTick(function() {
            User.findOne(query, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    if (query.username) {
                        return done(null, false, { message: ['Username not registered'] });
                    } else {
                        return done(null, false, { message: ['Email not registered'] });
                    }
                }
                if (!user.validPassword(password)) {
                    return done(null, false, { message: ['Wrong Password'] });
                }

                else {
                    return done(null, user);
                }
            });
        });

    }));

    passport.use('local-signup', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true,
        session: true
    },
    function(req, username, password, done) {

        var email = req.body.email.toLowerCase();
        // username = req.body.username;

        process.nextTick(function() {
            if (!req.user) {
                var emailSearch    = User.findOne({ 'local.email' : email }).exec();
                var usernameSearch = User.findOne({ username : username }).exec();

                Promise.all([emailSearch, usernameSearch])
                .then(function(data) {
                    var emailCheck = data[0];
                    var usernameCheck = data[1];
                    var message = dupeCheck(emailCheck, usernameCheck);
                    if (message.length) { // Checking if username or email is taken
                        return done(null, false, { message: message });
                    } else {
                        var newUser                 = new User();

                        newUser.local.email         = email;
                        newUser.username            = username;
                        newUser.local.password      = newUser.generateHash(password);

                        newUser.name.first          = req.body.firstname;
                        newUser.name.last           = req.body.lastname;
                        newUser.name.public         = false; // req.body.namePublic
                        // newUser.address.homeNumber  = req.body.homeNumber
                        //newUser.address.street         = req.body.street
                        newUser.address.city         = req.body.city;
                        newUser.address.province     = req.body.province;
                        //newUser.address.country        = req.body.country
                        // newUser.address.postalCode  = req.body.postalCode
                        newUser.address.public       = false; // req.body.addressPublic


                        newUser.save(function(err) {
                            if (err) { return done(err); }
                            return done(null, newUser);
                        });
                    }
                })
                .catch(function(err) {
                    console.error(err);
                    return done(err);
                });
            } else {
                return done(null, req.user);
            }

        });

    }));

};

var dupeCheck = function(email, username) {
    var message = [];

    if (email) {
        message.push('Email already taken');
    }
    if (username) {
        message.push('Username already taken');
    }
    return message;
};
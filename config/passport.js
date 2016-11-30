var LocalStrategy = require('passport-local').Strategy;
require('dotenv').config()

var User = require('../config/models/user');

module.exports = function(passport, ip, port) {

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // LOCAL
  passport.use('local-login', new LocalStrategy({
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true,
      session : true
  },
  function(req, email, password, done) {

      var email = email ? email.toLowerCase() : undefined

      process.nextTick(function() {
          User.findOne({ 'local.email' : email }, function(err, user) {
              if (err) {
                  return done(err);
              }
              if (!user) {
                  return done(null, false, { message: 'No matching email found' });
              }
              if (!user.validPassword(password)) {
                  return done(null, false, { message: 'Wrong Password' });
              }

              else {
                  return done(null, user);
              }
          });
      });

  }));

  passport.use('local-signup', new LocalStrategy({
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true,
      session: true
  },
  function(req, email, password, done) {
      var email = email ? email.toLowerCase() : undefined;

      process.nextTick(function() {
          if (!req.user) {
              User.findOne({ 'local.email' :  email }, function(err, user) {
                  if (err)
                      return done(err);

                  if (user) {
                      return done(null, false, { message: 'Email already in use.'});
                  } else {
                      var newUser                    = new User();

                      // required parameters
                      newUser.local.email            = email;
                      newUser.local.password         = newUser.generateHash(password);

                      // optional parameters
                      newUser.firstname              = req.body.firstname;
                      newUser.lastname               = req.body.lastname;
                      //newUser.address.homeNumber     = req.body.address.homeNumber
                      //newUser.address.street         = req.body.address.street
                      newUser.address.city           = req.body.address.city
                      newUser.address.province       = req.body.address.province
                      //newUser.address.country        = req.body.address.country
                      //newUser.address.postalCode     = req.body.address.postalCode


                      newUser.save(function(err) {
                          if (err)
                              return done(err);
                          return done(null, newUser);
                      });
                  }

              });
          } else {
              return done(null, req.user);
          }

      });

  }));

}
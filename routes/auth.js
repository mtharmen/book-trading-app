var passport = require('passport');
var User     = require('../config/models/user');

// Authenticating
module.exports = function(app) {

    // Checking if user is logged in and redirecting to appropriate page
    app.get('/profile', isLoggedIn);
    app.get('/my-books', isLoggedIn);
    app.get('/my-trades', isLoggedIn);
    app.get('/settings', isLoggedIn);

    // Getting User Info
    app.get('/auth/user', function(req, res) {
        if (req.user) { res.json(req.user); } 
        else { res.json({}); }
    });

    // LOCAL SIGNUP
    app.post('/auth/local-signup', function(req, res, next) {
        passport.authenticate('local-signup', function(err, user, info) {
            if (err) { return next(err); }
                
            if (!user) { return res.json(info); }

            req.login(user, function(err) {
                if (err) { return next(err); }
                return res.json(user);
            });
        })(req, res, next);
    });

    // LOCAL LOGIN
    app.post('/auth/local-login', function(req, res, next) {
        passport.authenticate('local-login', function(err, user, info) {
            if (err) { return next(err); }

            if (!user) { return res.json(info); }

            req.login(user, function(err) {
                if (err) { return next(err); }
                return res.json(user);
            });
        })(req, res, next);
    });

    // UPDATE INFO
    app.post('/auth/update', function(req, res, next) {

        // Currently the check happens client side and prevents submission so this should never be true
        if (req.body.newPassword !== req.body.pwCheck) {
            console.error('Passwords do not match');
        }

        User.findOne({ _id: req.user._id }, function(err, user) {
            if (err) { return next(err); }

            if (!user.validPassword(req.body.currentPassword)) {
                res.json({ message: 'Wrong Password' });
            } 

            else {
                // TODO: Add ability to change username and email
                //       If username change is implemented, Trade system needs to use ObjectID instead of username
                user.name.first       = req.body.firstname;
                user.name.last        = req.body.lastname;
                user.address.province = req.body.province;
                user.address.city     = req.body.city;

                user.local.password   = user.generateHash(req.body.newPassword);

                user.save(function(err, user) {
                    if (err) { return next(err); }

                    req.login(user, function(err) {
                        if (err) { return next(err); }
                        res.json(user);
                    });
                });

            }
        });

    });

    // Email Async Validation
    app.post('/auth/email-check', function(req, res, next) {
        User.findOne({ 'local.email' : req.body.email }, function(err, user) {
            if (err) { return next(err); }
            res.send(!!user);
        });
    });

    // Username Async Validation
    app.post('/auth/username-check', function(req, res, next) {
        User.findOne({ username : req.body.username }, function(err, user) {
            if (err) { return next(err); }
            res.send(!!user);
        });
    });

    // LOGOUT
    app.get('/auth/logout', function(req, res) {
        req.logout();
        res.send('logged out');
    });

};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/');
}
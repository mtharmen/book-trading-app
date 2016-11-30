// Authenticating
module.exports = function(app, passport) {

  // Checking if user is logged in and redirecting to appropriate page
  app.get('/profile', isLoggedIn);
  app.get('/new', isLoggedIn);
  app.get('/login', function (req, res, next) {
    if (!req.isAuthenticated())
      return next();
    res.redirect('/profile');
  });
  
  app.get('/auth/user', function(req, res) {
    if (req.user) {
      //console.log('User ' + req.user.twitter.username + ' Found');
      res.json({
        user: req.user.twitter
      })
    } 
    else {
      //console.log('No User Found');
      res.json({})
    }
  });
  
  // twitter
    // send to twitter to do the authentication
    app.get('/auth/twitter', passport.authenticate('twitter'));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
      passport.authenticate('twitter', {
        successRedirect : '/profile',
        failureRedirect : '/'
      }));

// Removing Account information from DB | currently unused since there is only twitter login
  // twitter
  app.get('/unlink/twitter', isLoggedIn, function(req, res) {
    var user           = req.user;
    user.twitter.token = undefined;
    user.save(function(err) {
      res.redirect('/profile');
    });
  });
};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
      return next();
    res.redirect('/');
}
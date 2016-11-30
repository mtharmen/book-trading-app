var path = require('path');

module.exports = function(app, passport) {
  
  app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/../views/index.html'))
  });

  app.get('/partials/:name', function(req, res) {
    var name = req.params.name;
    res.sendFile(path.join(__dirname, '/../views/partials/' + name + '.html'))
  })

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
};
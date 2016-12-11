var path = require('path');

module.exports = function(app, passport) {
  
    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname, '/../views/index.html'));
    });

    app.get('/partials/:name', function(req, res) {
        var name = req.params.name;
        res.sendFile(path.join(__dirname, '/../views/partials/' + name + '.html'));
    });

    // Catch all for AngularJS html5mode
    app.get('*', function(req, res) {
        res.sendFile(path.join(__dirname, '/../views/index.html'));
    });
};
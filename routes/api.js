var Book  = require('../config/models/book');

module.exports = function(app) {

  app.get('/api/previous', function(req, res) { 
    res.send(req.session.location)
  })

  app.get('/api/search/:term', function(req, res) {
    var user = req.user ? req.user.twitter.username : '';
    var term = req.params.term;
    console.log(term)
    res.send('Book Stuff')

  });

  app.post('/api/add/:book', function(req, res) {
    var book = req.params.book;
    console.log(book)
    res.send('book saved')
  })

  app.post('/api/remove/:book', function(req, res) {
    var book = req.params.book;
    res.send('removed book')
    
  })

}

var parse = function(data) {
  return data.map(function(elm, i) {
    var obj = {}
    return obj
  })
}

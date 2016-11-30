var mongoose = require('mongoose');

var bookSchema = new mongoose.Schema({ 
  ISBN   : Number,
  name   : String,
  img    : String,
  owner  : String,
  status : String  // available, requested, enroute
});

module.exports = mongoose.model('Book', bookSchema);
var mongoose = require('mongoose')

var bookSchema = new mongoose.Schema({
  ISBN: String,
  title: String,
  authors: [String],
  description: String,
  image: String,
  owner: String,
  traded: String
})

module.exports = mongoose.model('Book', bookSchema)

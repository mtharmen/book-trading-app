var mongoose = require('mongoose')

var tradeSchema = new mongoose.Schema({
  offer: {
    owner: String,
    ISBN: String,
    image: String,
    recieved: Date,
    hide: Boolean,
    viewed: Boolean
  },
  request: {
    owner: String,
    ISBN: String,
    image: String,
    recieved: Date,
    hide: Boolean,
    viewed: Boolean
  },
  status: {
    type: String,
    default: 'pending'
  },
  createDate: Date
})

module.exports = mongoose.model('Trade', tradeSchema)

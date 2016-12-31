var mongoose = require('mongoose');

var tradeSchema = new mongoose.Schema({
	offer   : {
		owner : String,
		ISBN  : String,
		image : String
	},
	request : {
		owner : String,
		ISBN  : String,
		image : String
	},
	status       : String,  // pending or accepted or rejected
	createDate   : Date,
	responseDate : Date,
	showOffer    : Boolean,
	showRequest  : Boolean
});

module.exports = mongoose.model('Trade', tradeSchema);
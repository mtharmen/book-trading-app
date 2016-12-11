var mongoose = require('mongoose');

// var tradeSubSchema = new mongoose.Schema({
// 	owner : String,
// 	ISBN  : String
// }, { _id : false })

var tradeSchema = new mongoose.Schema({ 
	offer   : {
		owner : String,
		ISBN  : String
	},
	request : {
		owner : String,
		ISBN  : String
	},
	status  : String  // pending or accepted or rejected
})

module.exports = mongoose.model('Trade', tradeSchema);
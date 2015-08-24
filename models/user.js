var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
 
module.exports = mongoose.model('User', {
	username : String,
	password : String,
	email    : String,
	game     : { type : ObjectId, ref : 'Game' }
});
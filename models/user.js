var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;


var invite = new mongoose.Schema({
	from     : { type : ObjectId, ref : 'User' } ,
	accepted : Boolean
});

module.exports = mongoose.model('User', {
	username : String,
	password : String,
	email    : String,
	game     : { type : ObjectId, ref : 'Game' },
	invites  : [invite]
});
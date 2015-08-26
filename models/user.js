var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('User', {
	username : String                     ,
	password : String                     ,
	email    : String                     ,
	score    : {type: Number, default: 0} ,
	trap     : {
		dur : {type: Number, default: 0} ,
		lat : {type: Number, default: 0} ,
		lng : {type: Number, default: 0}
	}
});
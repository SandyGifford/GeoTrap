var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;


var locations = new mongoose.Schema({
	lat : Number ,
	lon : Number ,
	dt  : String
});

var userWrapper = new mongoose.Schema({
	link  : { type : ObjectId, ref : 'User' } ,
	color : String                            ,
	locs  : [locations]
});

var invite = new mongoose.Schema({
	host     : { type : ObjectId, ref : 'User' } ,
	accepted : Boolean
});

module.exports = mongoose.model('User', {
	username   : String                            ,
	password   : String                            ,
	email      : String                            ,
	gameHost   : { type : ObjectId, ref : 'User' } ,
	hostedGame : {
		players  : [userWrapper] ,
		trapSize : Number        ,
		trapLife : Number        ,
		started  : Boolean
	}                                              ,
	invites    : [invite]
});
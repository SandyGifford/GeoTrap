var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var locations = new mongoose.Schema({
	lat : Number ,
	lon : Number ,
	dt  : String
});

var userWrapper = new mongoose.Schema({
	link  : { type : ObjectId, ref : 'User' } ,
	color : String                                   ,
	locs  : [locations]
});

module.exports = mongoose.model('Game', {
	users    : [userWrapper] ,
	trapSize : Number        ,
	trapLife : Number
});
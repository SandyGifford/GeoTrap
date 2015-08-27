var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('Goal', {
	lat : {type: Number, default: 0},
	lon : {type: Number, default: 0},
	exp : {type: Number, default: 0}  // EPOCH - we use this almost exclusively for comparisons, so keeping it in an overhead heavy 
});
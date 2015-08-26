var express   = require('express')        ;
var router    = express.Router()          ;
var UserModel = require('../models/user') ;

var playerOneColor = "green";
var playerColors = [ "red", "orange", "blue", "cyan", "purple" ]; // TODO: add more colors





// ---------------------- SUPPORT FUNCTIONS ---------------------- //
s
function getUserByID(userID, callback)
{
	getUser("_id", userID, callback);
}

function getUserByName(userName, callback)
{
	getUser("username", userName, callback);
}

function getUser(key, value, callback)
{
	var param = {};
	param[key] = value;
	
	UserModel
		.findOne(param)
		.exec(function (err, user)
		{
			if (err) return console.error(err);
			
			callback(user);
		});
}

function handleError(err)
{
	throw err; // TODO: something better than this, please
}






// ---------------------- ROUTING FUNCTIONS ---------------------- //

var isAuthenticated = function (req, res, next)   // fail -> /
{
	if (req.isAuthenticated())
		return next();
	
	res.redirect('/');
};





module.exports = function(passport)
{
	// ---------------------- GET HANDLERS ---------------------- //
	
	/* GET Login Page. */
	router.get('/', function(req, res)
	{
		// Display the Login page with any flash message, if any
		res.render('index', { message : req.flash('message') });
	});
	
	/* Registration Page */
	router.get('/signup', function(req, res)
	{
		res.render('register', { message : req.flash('message') });
	});
	
	/* Home Page */
	router.get('/home', gameHasStarted, function(req, res)
	{
		res.render('home', { user : req.user, message : req.flash('message') });
	});
	
	/* Logout Page */
	router.get('/signout', function(req, res)
	{
		req.logout();
		res.redirect('/');
	});
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	// ---------------------- POST HANDLERS ---------------------- //
	
	/* Registration */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect : '/home'   ,
		failureRedirect : '/signup' ,
		failureFlash    : true
	}));
	
	/* Login */
	router.post('/login', passport.authenticate('login', {
		successRedirect : '/home' ,
		failureRedirect : '/'     ,
		failureFlash    : true  
	}));
	
	/* Get Game Parameters */
	router.post('/getgameparams', gameHasStarted, function(req, res)
	{
		
	});
	
	/* Set Trap */
	router.post('/settrap', gameHasStarted, function(req, res)
	{
		var user = req.user  ;
		
		
	});

	return router;
};









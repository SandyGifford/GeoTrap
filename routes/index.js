var express   = require('express')        ;
var router    = express.Router()          ;
var geolib    = require('geolib')         ;
var UserModel = require('../models/user') ;

var playerOneColor = "green";
var playerColors = [ "red", "orange", "blue", "cyan", "purple" ]; // TODO: add more colors

// needs a better home
var gameInfo = {
	trapSize     : 500   , // Meters
	goalSize     : 2000  , // Meters
	trapStartDur : 3     , // Hits until expired
	goalPoints   : 10    , // Points for dropping a trap in a goal
	trapPenalty  : 2     , // Penalty for setting off a trap
	trapPoints   : 1     , // Points for getting someone in your trap+
	gameRadius   : 10000 , // Meters
	gameCenter   : {
		lat : 40.71  ,
		lng : -74.01
	}
};



// ---------------------- SUPPORT FUNCTIONS ---------------------- //

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

function getUsers(key, value, callback)
{
	var param = {};
	param[key] = value;
	
	UserModel
		.find(param)
		.exec(function (err, users)
		{
			if (err) return console.error(err);
			
			callback(users);
		});
}

function setTrap(user, lat, lng)
{
	user.trap = {
		dur : gameInfo.trapStartDur ,
		lat : lat                   ,
		lng : lng
	};
}

function handleError(err)
{
	throw err; // TODO: something better than this, please
}

function dropNewGoal()
{
	var theta = Math.random() * 2 * Math.PI         ;
	var r     = Math.random() * gameInfo.gameRadius ;
	
	var latOfst = r * Math.sin(theta);
	var lngOfst = r * Math.cos(theta);
	
	var goalLoc = {
		lat : latOfst + gameCenter.lat,
		lng : lngOfst + gameCenter.lng
	};
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
	router.get('/home', isAuthenticated, function(req, res)
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
	
	/* Get Game Parameters - data that does not change */
	router.post('/gameparams', isAuthenticated, function(req, res)
	{
		res.send({
			trapSize : gameInfo.trapSize ,
			goalSize : gameInfo.goalSize
		}); 
	});
	
	/* Get Game Info - data updates over the course of the game */
	router.post('/gameinfo', isAuthenticated, function(req, res)
	{
	});
	
	/* Get Player Info */
	router.post('/playerinfo', isAuthenticated, function(req, res)
	{
		var currentUser = req.user;
		
		var info = {
			score : currentUser.score
		};
		
		console.log(currentUser.trap.dur);
		
		if(currentUser.trap.dur > 0)
		{
			info.trap = {
				lat : currentUser.trap.lat ,
				lng : currentUser.trap.lng
			};
		}
		
		res.send(info);
	});
	
	/* Set Trap */
	router.post('/settrap', isAuthenticated, function(req, res)
	{
		var currentUser = req.user ;
		var hitTraps    = []       ;
		
		var userLoc     = {
			lat : req.body.lat ,
			lng : req.body.lng
		};
		
		console.log(userLoc);
		
//		if(typeof userLoc.lat !== "number" || typeof userLoc.lng !== "number")
//			res.send({ set : false, hit : false, hits : [] });
		
		UserModel
			.find({ "trap.dur" : { $gt : 0 } }, function(err, users)
			{
				for(var u = 0; u < users.length; u++)
				{
					var trapSetter = users[u];
					
					if(trapSetter != currentUser)
					{
						var dist = geolib.getDistance(
							{ latitude : trapSetter.trap.lat, longitude : trapSetter.trap.lng },
							{ latitude : userLoc.lat,         longitude : userLoc.lng         }
						);
						
						// hit trap
						if(dist < gameInfo.trapSize)
						{
							hitTraps.push({
								setter : trapSetter.username ,
								lat    : trapSetter.trap.lat ,
								lng    : trapSetter.trap.lng
							});
							
							currentUser.score -= gameInfo.trapPenalty ;
							trapSetter.score  += gameInfo.trapPoints  ;
							
							trapSetter.trap.dur--;
							
							if(currentUser.score < 0)
								currentUser.score = 0;
							
							trapSetter.save(function(err) {});
						}
					}
				}
				
				var hitATrap = hitTraps.length > 0;
				
				if(!hitATrap)
					setTrap(currentUser, userLoc.lat, userLoc.lng);
				
				currentUser.save(function(err)
				{
					res.send({ set : !hitATrap, hit : hitATrap, hits : hitTraps });
				});
			});
	});

	return router;
};









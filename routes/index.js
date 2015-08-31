var express   = require('express')        ;
var router    = express.Router()          ;
var geolib    = require('geolib')         ;
var UserModel = require('../models/user') ;
var GoalModel = require('../models/goal') ;

var playerOneColor = "green";
var playerColors = [ "red", "orange", "blue", "cyan", "purple" ]; // TODO: add more colors

// needs a better home
var gameInfo = {
	goalSize     : 2000  , // Meters
	goalPoints   : 10    , // Points for dropping a trap in a goal
	goalCount    : 3     ,
	trapSize     : 500   , // Meters
	trapStartDur : 3     , // Hits until expired
	trapPenalty  : 2     , // Penalty for setting off a trap
	trapPoints   : 3     , // Points for getting someone in your trap+
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

function dropNewGoal(callback)
{
	var loc = randomLatLngInRadius(gameInfo.gameCenter.lat, gameInfo.gameCenter.lng, gameInfo.gameRadius);
	
	var goal = new GoalModel({
		lat : loc.lat ,
		lng : loc.lng ,
		exp : 0
	});
	
	goal.save(function (err, goal)
	{
		if (err) return console.error(err);
		
		if(callback)
			callback(goal);
	});
}

function dropNGoals(n, callback)
{
	var goals = [];
	
	for(var i = 0; i < n; i++)
	{
		dropNewGoal(function(goal)
		{
			if (err) return console.error(err);
			
			goals.push(goal);
			
			if(goals.length >= n)
				if(callback)
					callback(goals);
		});
	}
}

// picks a random lat/lng in a given radius around a given point.  Really rough approximation with uneven distribution but it works.
function randomLatLngInRadius(lat, lng, r)
{
	return latLngAtDist(lat, lng, Math.random() * r, Math.random() * 360);
}

// gets a lat/lng a given distance from a given point at a given angle.  Does all the trig in a plane then projects that onto an (oblong) globe - only really accurate over short distances, but, again, none of this needs to be super precise.
function latLngAtDist(lat, lng, dist, angle)
{
	angle *= Math.PI / 180;
	
	var dx = dist * Math.cos(angle);
	var dy = dist * Math.sin(angle);
	
	var dLat = dx / (111320 * Math.cos(lat)) ;
	var dLng = dx / 110540                   ;
	
	return { lat : lat + dLat, lng : lng += dLng };
}

function getGoals(callback)
{
	GoalModel.find(function(err, goals)
	{
		if (err) return console.error(err);
		
		var ret = [];
		
		console.log("\r\n\r\n\r\ngetting goals");
		console.log(goals);
		console.log("\r\n\r\n\r\n");
		
		for(var g = 0; g < goals.length; g++)
		{
			// TODO: check expiration, remove if past
			ret.push({ lat : goals[g].lat, lng : goals[g].lng });
		}
		
		if(callback)
			callback(ret);
	});
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
		getGoals(function(goals)
		{
			console.log("\r\n\r\n\r\ngot goals 1");
			console.log(goals);
			console.log("\r\n\r\n\r\n");
			
			var goalDeficit = gameInfo.goalCount - goals.length;
			
			console.log("def - " + goalDeficit);
			
			if(goalDeficit > 0)
			{
				dropNGoals(goalDeficit, function()
				{
					getGoals(function(goals) // TODO: this double call to getGoals is crap...
					{
						console.log("\r\n\r\n\r\ngot goals 2");
						console.log(goals);
						console.log("\r\n\r\n\r\n");
						res.send({ goals : goals });
					});
				});
			}
			else
			{
				res.send({ goals : goals });
			}
		});
	});
	
	/* Get Player Info */
	router.post('/playerinfo', isAuthenticated, function(req, res)
	{
		var currentUser = req.user;
		
		var info = {
			score : currentUser.score
		};
		
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









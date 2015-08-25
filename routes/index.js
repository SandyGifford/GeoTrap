var express   = require('express')        ;
var router    = express.Router()          ;
var GameModel = require('../models/game') ;
var UserModel = require('../models/user') ;

var playerOneColor = "green";
var playerColors = [ "red", "orange", "blue", "cyan", "purple" ]; // TODO: add more colors


function handleError(err)
{
	throw err; // TODO: something better than this, please
}


var isAuthenticated = function (req, res, next)
{
	if (req.isAuthenticated())
		return next();
	
	res.redirect('/');
};


// Make sure to ALWAYS call gameActive before playerCanBeAdded
var playerCanBeAdded = function (req, res, next)
{
	GameModel
		.findOne({ _id: req.user.game })
		.exec(function (err, game)
		{
			if (err) return handleError(err);
			
			UserModel
				.findOne({ _id: game.host })
				.exec(function (err, host)
				{
					if (err) return handleError(err);
					
					// is the player the host?
					if(host.username == req.user.username)
						return next();
					else
						res.redirect('home'); // players have pretty much no business being in this function if they're not host - no need to fancy it up with a message, this is just a security check
					
					
					// is the player already in the game?
					for(var u = 0; u < game.users.length; u++)
					{
						var linkedUser = game.users[u];
						
						if(user.linkedUser == req.body.username)
						{
							res.send("User " + req.body.username + " is already in this game!");
							return;
						}
					}
					
					return next();
				});
		});
};

// Make sure to ALWAYS call isAuthenticated before gameActive
var gameActive = function (req, res, next)
{
	if(req.user.game)
	{
		GameModel
			.findOne({ _id: req.user.game })
			.exec(function (err, game)
			{
				if (err) return handleError(err);
				
				if(game)
				{
					return next();
				}
				else
				{
					// so the user has a game, but it's no longer active.  Let's update the user
					UserModel.update({ _id : req.user._id}, { game : null }, function(err)
					{
						if (err) return console.error(err);
						//...
					});
					
					res.redirect('nogame');
				}
			});
	}
	else
	{
		res.redirect('nogame');
	}
};

// Make sure to ALWAYS call isAuthenticated before gameNotActive
var gameNotActive = function (req, res, next)
{
	if(!req.user.game)
		return next();
	else
		res.redirect('home');
};

module.exports = function(passport)
{
	/* GET login page. */
	router.get('/', function(req, res)
	{
		// Display the Login page with any flash message, if any
		res.render('index', { message : req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect : '/home' ,
		failureRedirect : '/'     ,
		failureFlash    : true  
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register', { message : req.flash('message') });
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect : '/home'   ,
		failureRedirect : '/signup' ,
		failureFlash    : true
	}));

	/* Handle Create Game POST */
	router.post('/creategame', isAuthenticated, gameNotActive, function(req, res)
	{
		var user = req.user;
		
		var trapSize = parseFloat(req.body.trapsize) ;
		var trapLife = parseFloat(req.body.traplife) ;
		
		if(isNaN(trapSize) || isNaN(trapLife))
			res.redirect("/nogame");
		
		var game = new GameModel({
			trapSize : trapSize ,
			trapLife : trapLife ,
			host     : user     ,
			users    : [{
				link  : user            ,
				color : playerColors[0] ,
				locs  : []
			}]
		});
		
		game.save(function (err, game)
		{
			if (err) return console.error(err);
			
			UserModel.update({ _id : user._id}, { game : game }, function(err)
			{
				if (err) return console.error(err);
				//...
			});
			
			res.redirect("/home");
		});
	});

	/* Handle Add Player POST */
	router.post('/addplayer', isAuthenticated, gameActive, playerCanBeAdded, function(req, res)
	{
		GameModel
			.findOne({ _id: req.user.game })
			.exec(function (err, game)
			{
				if (err) return handleError(err);
				
				UserModel
					.findOne({ _id: req.body.username })
					.exec(function (err, newPlayer)
					{
						if (err) return handleError(err);
						
						var color = playerColors[game.users.length % playerColors.length];
						
						game.users.push({
							link  : newPLayer ,
							color : color     ,
							locs  : []
						});
						
						game.save(function (err)
						{
							if (err) return handleError(err)
								
							console.log('Added player ' + req.body.username + ' to game');
						});
					});
			});
	});
	
	/* Handle Get Game Parameters POST */
	router.post('/getgameparams', isAuthenticated, gameActive, function(req, res)
	{
		var now = new Date().getTime() ;
		
		GameModel
			.findOne({ _id: req.user.game })
			.exec(function (err, game)
			{
				if (err) return handleError(err);
				
				
				// TODO: should really just transform the entire game object to JSON so that this function doesn't have to update every time the Game schema changes
				var resGame = {
					trapSize : game.trapSize ,
					trapLife : game.trapLife ,
					host     : game.host     ,
					players  : []
				};
				
				for(var u = 0; u < game.users.length; u++)
				{
					var userWrapper = game.users[u];
					UserModel
						.findOne({ _id : userWrapper.link })
						.exec(function (err, linkedUser)
						{
							if (err) return handleError(err);
							
							var resUser = {
								color : userWrapper.color,
								locs  : []
							};
							
							if(linkedUser.username == req.user.username)
							{
								resUser.color = playerOneColor;
								
								for(var l = 0; l < userWrapper.locs.length; l++)
								{
									var loc = userWrapper.locs[l];
									
									if(now - loc.dt < game.trapLife * 86400) // player should only see their active traps
										resUser.locs.push({ lat : loc.lat, lon : loc.lon});
								}
								
								resGame.currentPlayer = resUser;
							}
							else
							{
								for(var l = 0; l < userWrapper.locs.length; l++)
								{
									var loc = userWrapper.locs[l];
									
									if(now - loc.dt > game.trapLife * 86400) // player should only see expired traps from opponents
										resUser.locs.push({ lat : loc.lat, lon : loc.lon });
								}
								
								resGame.players.push(resUser);
							}
							
							// TODO: this seems like a risky way to check if we're done, but the async sort of requires that we do it this way.  Investigate.
							if(resGame.players.length == game.users.length - 1 && resGame.currentPlayer)
								res.json(resGame);
						});
				}
			});
	});

	/* Handle Set Trap POST */
	router.post('/settrap', isAuthenticated, gameNotActive, function(req, res)
	{
		var user = req.user  ;
		var game = user.game ;
		
		
	});

	/* GET Home Page */
	router.get('/home', isAuthenticated, gameActive, function(req, res)
	{
		res.render('home', { user : req.user });
	});

	/* GET no active game page */
	router.get('/nogame', isAuthenticated, gameNotActive, function(req, res)
	{
//		res.send("no active game");
		res.render('nogame', { user : req.user });
	});

	/* Handle Logout */
	router.get('/signout', function(req, res)
	{
		req.logout();
		res.redirect('/');
	});

	return router;
};
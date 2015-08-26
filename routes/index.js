var express   = require('express')        ;
var router    = express.Router()          ;
var UserModel = require('../models/user') ;

var playerOneColor = "green";
var playerColors = [ "red", "orange", "blue", "cyan", "purple" ]; // TODO: add more colors





// ---------------------- SUPPORT FUNCTIONS ---------------------- //

function clearInvites(user, callback)
{
	var invites = user.invites;
	var invitesProcessed = 0;
	
	if(invites.length == 0)
	{
		if(callback)
			callback();
		
		return;
	}
	
	for(var i = 0; i < invites.length; i++)
	{
		(function(invite)
		{
			user.invites = [];
			
			user.save(function (err)
			{
				if (err) return console.error(err);
				
				invitesProcessed++;
				
				if(callback && invitesProcessed >= invites.length)
					callback();
			});
		})(invites[i])
	}
}

function forEachPlayerInGame(game, each, callback)
{
	var players = game.players;
	var playersProcessed = 0;
	var breakOut = false;
	
	for(var p = 0; p < players.length; p++)
	{
		getUserByID(players[p].link, function(player)
		{
			each(
				player,
				function() // done function
				{
					playersProcessed++;
					
					if(callback && playersProcessed >= players.length)
						callback();
				}
			);
		});
	}
}

function playerInGame(player, game, callbacks)
{
	var inGame = false;
	
	forEachPlayerInGame(
		game,
		function(inGamePlayer, done)
		{
			if(player == inGamePlayer)
				inGame = true;
			
			done(); // TODO: make a break function for forEachPlayerInGame
		},
		function()
		{
			if(inGame && callbacks.yes)
				callbacks.yes();
			if(!inGame && callbacks.no)
				callbacks.no();
			if(callbacks.all)
				callbacks.all(inGame);
		}
	);
}

function leaveGame(user, callback)
{
	if(!user.gameHost)
	{
		callback();
		return;
	}
	
	getUserByID(user.gameHost, function(host)
	{
		var players = host.hostedGame.players;
		var p;
		
		
		for(p = 0; p < players.length && players[p].link.toString() != user._id; p++) { }
		
		if(p < players.length)
			players.splice(p, 1);
		
		host.save(function (err)
		{
			if (err) return console.error(err);
		
			user.gameHost = null;
			var newInvites = user.invites;
			
			for(var i = 0; i < user.invites.length; i++)
			{
				if(user.invites[i].host == host._id )
				{
					newInvites = user.invites.slice(i, i + 1);
				}
			}
			
			user.invites = newInvites;
			
			user.save(function (err)
			{
				if (err) return console.error(err);
				
				callback();
			});
		});
	});
};

function clearClientPlayers(host, callback)
{
	var clientsProcessed = 0;
	
	UserModel
		.find({ 'gameHost' : host }, function(err, clients)
		{
			if (err) return console.error(err);
			
			if(clients.length == 0)
			{
				if(callback)
					callback();
				
				return;
			}
			
			for(var c = 0; c < clients.length; c++)
			{
				leaveGame(clients[c], function()
				{
					clientsProcessed++;
					if(clientsProcessed >= clients.length && callback)
						callback();
				});
			}
		});
}

function endHostedGame(host, callback)
{
	clearClientPlayers(host, function()
	{
		host.hostedGame = null;
		
		host.save(function (err)
		{
			if (err) return console.error(err);
			
			if(callback)
				callback();
		});
	});
}

function getGame(user, callback)
{
	if(!user.gameHost)
	{
		callback(null);
		return;
	}
	
	getUserByID(user.gameHost, function(host)
	{
		callback(host.hostedGame);
	});
}

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

var isInGame = function (req, res, next)          // fail -> /creategame
{
	isAuthenticated(req, res, function()
	{
		var gameHost = req.user.gameHost;
		
		if(gameHost)
			return next();
		else
			res.redirect('/creategame');
	});
};

var isNotInGame = function (req, res, next)       // fail -> /home
{
	isAuthenticated(req, res, function()
	{
		var gameHost = req.user.gameHost;
		
		if(!gameHost)
			return next();
		else
			res.redirect('/home');
	});
};

var isHostingGame = function (req, res, next)     // fail -> /creategame
{
	isAuthenticated(req, res, function()
	{
		var gameHost = req.user.gameHost;
		
		if(gameHost.toString() == req.user._id)
			return next();
		else
			res.redirect('/creategame');
	});
};

var isNotHostingGame = function (req, res, next)  // fail -> /home
{
	isAuthenticated(req, res, function()
	{
		var gameHost = req.user.gameHost;
		
		if(gameHost != req.user)
			return next();
		else
			res.redirect('/home');
	});
};

var gameHasNotStarted = function (req, res, next) // fail -> /home
{
	isAuthenticated(req, res, function()
	{
		getGame(req.user, function(game)
		{
			if(!game || !game.started)
				return next();
			else
				res.redirect('/home');
		});
	});
};

var gameHasStarted = function (req, res, next)    // fail -> /creategame
{
	isInGame(req, res, function()
	{
		getGame(req.user, function(game)
		{
			if(game.started)
				return next();
			else
				res.redirect('/creategame');
		});
	});
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
	
	/* Create Game Page */
	router.get('/creategame', gameHasNotStarted, function(req, res)
	{
		var user = req.user;
		
		endHostedGame(user, function()
		{
			user.hostedGame = {
				players   : [{
					link  : user            ,
					color : playerColors[0] ,
					locs  : []
				}],
				started   : false
			};
			
			user.gameHost = user;
			
			user.save(function (err, user)
			{
				if (err) return console.error(err);
				
				res.redirect("/home");
			});
			
			res.render('creategame', { user : req.user, message : req.flash('message')  });
		});
	});
	
	/* Join Game Page */
	router.get('/joingame', gameHasNotStarted, function(req, res)
	{
		clearInvites(req.user, function()
		{
			res.render('joingame', { user : req.user, message : req.flash('message')  });
		});
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
	
	/* Start Game */
	router.post('/startgame', gameHasNotStarted, function(req, res)
	{
		var user = req.user;
		var game = user.hostedGame;
		
		var trapSize = parseFloat(req.body.trapsize) ;
		var trapLife = parseFloat(req.body.traplife) ;
		
		console.log(trapSize + ", " + trapLife);
		
		if(isNaN(trapSize) || isNaN(trapLife))
			res.redirect("/creategame");
		
		game.trapSize = trapSize ;
		game.trapLife = trapLife ;
		game.started  = true     ;
		
		// All players who accepted invites are pointed at game, and get their invites cleared
		forEachPlayerInGame(
			game,
			function(player, done)
			{
				clearInvites(player, function()
				{
					clearClientPlayers(player, function()
					{
						done();
					});
				});
			},
			function()
			{
				user.save(function (err, game)
				{
					if (err) return console.error(err);
					
					res.redirect("/home");
				});
			}
		);
	});
	
	/* Retrieve Accepted Invites */
	router.post('/gameinvitestatus', isHostingGame, gameHasNotStarted, function(req, res)
	{
		var user = req.user;
		var game = user.hostedGame;
		var playersProcessed = 0;
		
		var invites = [];
		
		for(var p = 0; p < game.players.length; p++)
		{
			(function(pWrapper)
			{
				getUserByID(pWrapper.link, function(player)
				{
					playersProcessed++;
					
					invites.push({
						username : player.username ,
						color    : pWrapper.color
					});
					
					if(playersProcessed >= game.players.length)
						res.send(invites);
				});
			})(game.players[p])
		}
	});
	
	/* Retrieve invites for current player */
	router.post('/invites', isAuthenticated, function(req, res)
	{
		var invites = req.user.invites;
		var resInvites = [];
		
		if(invites.length == 0)
		{
			res.send([]);
			return;
		}
		
		for(var i = 0; i < invites.length; i++)
		{
			(function(invite)
			{
				getUserByID(resInvites.host, function(host)
				{
					resInvites.push({ hostName : host.username, accepted : invite.accepted });
					
					if(resInvites.length >= invites.length)
						res.send(resInvites);
				});
			})(invites[i])
		}
	});
	
	/* Accept Invite */
	router.post('/acceptinvite', isNotInGame, function(req, res)
	{
		var user        = req.user          ;
		var hostname    = req.body.hostname ;
		var invites     = user.invites      ;
		var invCount    = 0                 ;
		var inviteFound = false             ;
		
		for(var i = 0; i < invites.length; i++)
		{
			(function(invite)
			{
				getUserByID(invite.host, function(host)
				{
					if(host.username == hostname)
					{
						inviteFound = true;
						invite.accepted = true;
					}
					else
					{
						invite.accepted = false; // make sure only one invite is accepted
					}
					
					user.save(function (err)
					{
						if (err) return handleError(err);
						
						invCount++;
						
						if(invCount == invites.length)
							res.send(inviteFound);
					});
				});
			})(invites[i]) // inside of loop is asynchronous, so we must create a closure for any variables that change over the loop
		}
	});
	
	/* Invite Player */
	router.post('/inviteplayer', gameHasNotStarted, function(req, res)
	{
		var user = req.user;
		
		if(user.username == req.body.username)
		{
			res.send(false);
			return;
		}
		
		
		getUserByName(req.body.username, function(newPlayer)
		{
			if(!newPlayer || newPlayer.gameHost == user) // check for no player before handling other errors
			{
				res.send(false);
				return;
			}
			
			playerInGame(
				newPlayer, user.hostedGame,
				{
					yes : function()
					{
						res.send(false);
					},
					no  : function()
					{
						for(var i = 0; i < newPlayer.invites.length; i++)
						{
							if(newPlayer.invites[i].host == user.username)
							{
								res.send(true);
								return;
							}
						}
						
						newPlayer.invites.push({
							host     : user ,
							accepted : true    // TODO: for now there is no unaccepted state
						});
						
						newPlayer.save(function (err)
						{
							if (err) return handleError(err);
							
							user.hostedGame.players.push({
								link  : newPlayer       ,
								color : playerColors[user.hostedGame.players.length % playerColors.length] ,
								locs  : []
							});
							user.save(function (err)
							{
								if (err) return handleError(err);
								
								res.send(true);
							});
						});
					}
				}
			);
		});
	});
	
	/* Get Game Parameters */
	router.post('/getgameparams', gameHasStarted, function(req, res)
	{
		/*
		var now = new Date().getTime() ;
		
		getGame(req.user, function(game)
		{
			
		});
		
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
	*/
	});
	
	/* Set Trap */
	router.post('/settrap', gameHasStarted, function(req, res)
	{
		var user = req.user  ;
		
		
	});

	return router;
};









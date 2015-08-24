var express   = require('express')        ;
var router    = express.Router()          ;
var GameModel = require('../models/game') ;
var UserModel = require('../models/user') ;

var isAuthenticated = function (req, res, next)
{
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

// ALWAYS should be called after isAuthenticated
var gameActive = function (req, res, next)
{
	if(typeof req.user.game == "object")
	{
		return next();
	}
	
	res.redirect('nogame');
}

var gameNotActive = function (req, res, next)
{
	if(typeof req.user.game != "object")
	{
		return next();
	}
	
	res.redirect('home');
}

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
		
		var game = new GameModel({trapSize : req.trapSize, traplife : req.traplife, users : [user]});
		
		game.save(function (err, game)
		{
			if (err) return console.error(err);
			
			UserModel.update({ _id : user._id}, { game : game }, function(err)
			{
				if(err) { throw err; }
				//...
			});
			
			res.redirect("/home");
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
}
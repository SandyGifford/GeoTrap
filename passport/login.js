var LocalStrategy = require('passport-local').Strategy ;
var User          = require('../models/user')          ;
var bCrypt        = require('bcrypt-nodejs')           ;

module.exports = function(passport)
{
	passport.use('login',
		new LocalStrategy({ passReqToCallback : true },
			function(req, username, password, done)
			{ 
				// Search the DB for the username
				User.findOne({ 'username' :  username }, 
					function(err, user)
					{
						// Error catching for DB search callback
						if (err)
							return done(err);
						
						// DB was searched without error, but no such user was found
						if (!user)
						{
							console.log('User ' + username + ' was not found');
							return done(null, false, req.flash('message', 'User Not found.'));
						}
						
						// User exists but provided the wrong password
						if (!bCrypt.compareSync(password, user.password))
						{
							console.log('Invalid Password');
							return done(null, false, req.flash('message', 'Invalid Password'));
						}
						
						// Everything looks good!
						return done(null, user);
					}
				);
			}
		)
	);
}
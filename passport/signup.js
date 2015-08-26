var LocalStrategy   = require('passport-local').Strategy ;
var User            = require('../models/user')          ;
var bCrypt          = require('bcrypt-nodejs')           ;

module.exports = function(passport)
{
	passport.use('signup',
		new LocalStrategy({ passReqToCallback : true },
			function(req, username, password, done)
			{
				findOrCreateUser = function()
				{
					// Search the DB for the username
					User.findOne({ 'username' : username }, function(err, user)
					{
						// Error catching for DB search callback
						if (err)
						{
							console.log('Error while registering: ' + err);
							return done(err);
						}
						
						// User already exists.
						if (user)
						{
							console.log('User already exists');
							return done(null, false, req.flash('message','User Already Exists'));
						}
						else
						{
							// create the user
							var newUser = new User();
							
							newUser.username   = username             ;
							newUser.password   = createHash(password) ;
							newUser.email      = req.param('email')   ;
							newUser.score      = 0                    ;
							newuser.trapActive = false                ;
							
							newUser.save(function(err)
							{
								if (err)
								{
									console.log('Error Saving user: ' + err);
									throw err;  
								}
								
								console.log('User Registration succesful');
								return done(null, newUser);
							});
						}
					});
				};

				// Delay the execution of findOrCreateUser and execute 
				// the method in the next tick of the event loop
				process.nextTick(findOrCreateUser);
			}
		)
	);

	// Generates hash using bCrypt
	var createHash = function(password){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	}
};
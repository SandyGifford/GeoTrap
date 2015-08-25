$(function()
{
	var form       = $("#GameForm")  ;
	var newPlayer  = $("#NewPlayer") ;
	var playerList = $("#Players")   ;
	var players    = {}              ;
	
	var submit = $("#CreateGame")
		.click(function()
		{
			var formData = form.serializeArray();
		});
	
	var invite = $("#InvitePlayer")
		.click(function()
		{
			var username = newPlayer.val();
			
			if(typeof players[username] !== "undefined")
				return;
			
			$.ajax({
				type     : "POST"     ,
				url      : "/inviteplayer" ,
				data     : {
					username : username
				},
				success  : function(itWorked)
				{
					if(itWorked)
					{
						var li = $("<li>")
							.text(username)
							.appendTo(playerList);
						
						players[username] = {
							el : li
						};
					}
				}
			});
		});
});
(function($)
{
	var form, newPlayer, playerList, submit, invite;
	var players = {};
	
	function updatePlayers()
	{
		$.ajax({
			type     : "POST"     ,
			url      : "/gameinvitestatus" ,
			success  : function(invites)
			{
				if(typeof invites != "object")
					return;
				
				playerList.empty();
				
				for(var i = 0; i < invites.length; i++)
				{
					var invite = invites[i];
					
					var li = $("<li>")
						.text(invite.username)
						.appendTo(playerList)
						.css("background-color", invite.color);
					
					$("<i>")
						.addClass("dynamic-list-addon fa fa-times")
						.appendTo(li);
				}
			},
			complete : function()
			{
				setTimeout(updatePlayers, 1000);
			}
		});
	}
	
	$(function()
	{
		form       = $("#GameForm")  ;
		newPlayer  = $("#NewPlayer") ;
		playerList = $("#Players")   ;
		
		invite = $("#InvitePlayer")
			.click(function()
			{
				var username = newPlayer.val();
				
				if(typeof players[username] !== "undefined")
					players[username].el.remove();
				
				$.ajax({
					type     : "POST"     ,
					url      : "/inviteplayer" ,
					data     : {
						username : username
					},
					success  : function(itWorked)
					{
						if(typeof itWorked == "boolean" && itWorked)
						{
							newPlayer.val("");
							
							var li = $("<li>")
								.text(username)
								.appendTo(playerList);
							
							$("<i>")
								.addClass("dynamic-list-addon fa fa-times")
								.appendTo(li);
							
							players[username] = {
								el : li
							};
						}
					}
				});
			});
		updatePlayers();
	});
})(jQuery)
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
					if(typeof itWorked == "boolean" && itWorked)
					{
						var li = $("<li>")
							.text(username)
							.appendTo(playerList);
						
						$("<i>")
							.addClass(dynamic-list-addon fa fa-times)
							.appendTo(li);
						
						players[username] = {
							el : li
						};
					}
				}
			});
		});
});
(function($)
{
	var invitesList;
	
	function updateInvites()
	{
		$.ajax({
			type     : "POST"     ,
			url      : "/invites" ,
			success  : function(invites)
			{
				if(typeof invites != "object")
					return;
				
				invitesList.empty();
				
				for(var i = 0; i < invites.length; i++)
				{
					var invite = invites[i];
					
					var li = $("<li>")
						.text(invite.hostName)
						.appendTo(invitesList);
					
					$("<i>")
						.addClass("dynamic-list-addon fa fa-times")
						.appendTo(li);
				}
			},
			complete : function()
			{
				setTimeout(updateInvites, 1000);
			}
		});
	}
	
	$(function()
	{
		invitesList = $("#Invites");
		
		updateInvites();
	});
})(jQuery)
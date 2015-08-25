(function()
{
	var trapSize;
	var trapLife;
	
	$(function()
	{
		var map       = $("#Map")            ;
		var setTrap   = $("#SetTrap")        ;
		var updatePos = $("#UpdatePosition") ;
		
		var newTrapRadius;
		var newTrapMarker;
		var playerMarkers = [];
		
		map.css({"height" : map.width() + "px"});
		
		
		
		// For now there's no reason to not load the map from the get-go, but if this ever turns into a REST app, the ability to delay the loading of the map would be invaluable.
		gMap.load(map, function(loc)
		{
			mapLoaded = true;
			gMap.centerOnGeoloc(updateComplete);
		});
		
		setTrap.click(function()
		{
			
		});
		
		gMap.postTrap = function()
		{
			$.ajax({
				type     : "POST"     ,
				url      : "/settrap" ,
				data     : {
//					lat : playerLoc.latitude  ,
//					lon : playerLoc.longitu
					lat : 0  ,
					lon : 0
				},
				success  : success
			});
		};
		
		updatePos.click(updateAndCenter);
		
		function updateAndCenter()
		{
			disableButtons();
			
			gMap.centerOnGeoloc(updateComplete);
		}
		
		function updateComplete(loc)
		{
			$.ajax({
				type : "POST"     ,
				url  : "/getgameparams" ,
				data : {
					lat : 0 ,
					lon : 0
				},
				success : function(gameInfo)
				{
					if(newTrapRadius)
						newTrapRadius.setMap(null);
					if(newTrapMarker)
						newTrapMarker.setMap(null);
					
					for(var m = 0; m < playerMarkers.length; m++)
						playerMarkers[m].setMap(null);
					
					playerMarkers = [];
					
					newTrapRadius = gMap.drawRadius(loc, gameInfo.trapSize, gameInfo.currentPlayer.color);
					newTrapMarker = gMap.dropMarker({
						position : loc,
						message  : "Current Location",
						icon     : {
							url    : "/images/anibgren.gif"       , // TODO: make my own damn image (http://www.avbuffjr.com/ani_gifs/anibgren.gif)
							size   : new google.maps.Size(10, 10) ,
							origin : new google.maps.Point(0, 0)  ,
							anchor : new google.maps.Point(5, 5)
						}
					});
					
					gMap.fitBounds(newTrapRadius);
					
					for(var p = 0; p < gameInfo.players.length; p++)
					{
						var player = gameInfo.players[p];
						
						for(var l = 0; l < player.locs.length; l++)
						{
							var trapLoc = player.locs[l];
							
							playerMarkers.push(gMap.dropMarker({
								position : { latitude : trapLoc.lat, longitude : trapLoc.lon },
								message  : "Expired Trap"
							}));
						}
					}
					
					enableButtons();
				}
			});
		}
		
		function disableButtons()
		{
			updatePos.prop('disabled', true);
			setTrap.prop('disabled', true);
		}
		
		function enableButtons()
		{
			updatePos.prop('disabled', false);
			setTrap.prop('disabled', false);
		}
		
		disableButtons();
	});
})();
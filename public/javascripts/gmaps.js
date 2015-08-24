var initMap;

var gMap = {};


(function($)
{
	var mapLoaded = false;
	var mapEl;
	var playerLoc;
	
	var messages = {
		geoNotAvail : "It looks like your browser doesn't support Geolocation - try a different browser",
		geoFailed   : "Could not get Geolocation.  Do you have it disabled?"
	};
	
	gMap.load = function()
	{
		if(mapLoaded)
		{
			console.warn("map already loaded");
			return;
		}
		
		mapLoaded = true;
		
		$("<script>")
			.attr("type",  "text/javascript")
			.attr("async", "")
			.attr("defer", "")
			.attr("src",   "https://maps.googleapis.com/maps/api/js?key=AIzaSyCVITkGMRa8bqrjXhSfFkzz3kz7Jz-yXig&callback=initMap")
			.appendTo($("body"));
	}
	
	gMap.postTrap = function()
	{
		$.ajax({
			type     : "POST"     ,
			url      : "/settrap" ,
			data     : {
				lat : playerLoc.latitude  ,
				lon : playerLoc.longitude
			},
			success  : success
		});
	};
	
	gMap.updatePosition = function()
	{
		navigator.geolocation.getCurrentPosition(
			function(position)
			{
				playerLoc = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
				map.setCenter(playerLoc);
			},
			function()
			{
				alert(messages.geoFailed);
			}
		);
	}
	
	initMap = function()
	{
		mapEl = $("#map");
		mapEl.css({"height" : mapEl.width() + "px"});
		
		var myOptions = {
			zoom               : 6                             ,
			mapTypeId          : google.maps.MapTypeId.ROADMAP ,
			panControl         : false                         ,
			zoomControl        : true                          ,
			mapTypeControl     : false                         ,
			scaleControl       : true                          ,
			streetViewControl  : false                         ,
			overviewMapControl : false
		};
		
		var map = new google.maps.Map(mapEl[0], myOptions);

		// Try W3C Geolocation (Preferred)
		if(navigator.geolocation)
		{
			gMap.updatePosition();
		}
		// Browser doesn't support Geolocation
		else
		{
			alert(messages.geoNotAvail);
		}
	}
})(jQuery);

// For now there's no reason to not load the map from the get-go, but if this ever turns into a REST app, the ability to delay the loading of the map would be invaluable.
gMap.load();
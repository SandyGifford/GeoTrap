

// TODO: this file is a little bit purpose built.  Clean it up, make a new repository for it.

var initMap;

var gMap = {};


(function($)
{
	var mapLoaded  = false;
	var mapEl;
	var map;
	var loadCallback;
	
	var messages = {
		geoNotAvail : "It looks like your browser doesn't support Geolocation - try a different browser",
		geoFailed   : "Could not get Geolocation.  Do you have it disabled?"
	};
	
	gMap.load = function(mapElement, callback)
	{
		if(mapLoaded)
		{
			console.warn("map already loaded");
			return;
		}
		
		mapLoaded = true; // well, not fully loaded - but we want to prevent double clicks
		
		mapEl = mapElement;
		loadCallback = callback;
		
		$("<script>")
			.attr("type",  "text/javascript")
			.attr("async", "")
			.attr("defer", "")
			.attr("src",   "https://maps.googleapis.com/maps/api/js?key=AIzaSyCVITkGMRa8bqrjXhSfFkzz3kz7Jz-yXig&callback=initMap")
			.appendTo($("body"));
	};
	
	// Just a simplified draw circle routine
	gMap.drawRadius = function(loc, radius, color)
	{
		return gMap.drawCircle({
			radius        : radius     ,
			strokeColor   : color      ,
			strokeOpacity : 0.8        ,
			strokeWeight  : 2          ,
			fillColor     : color      ,
			fillOpacity   : 0.35       ,
			center        : loc
		});
	};
	
	gMap.drawCircle = function(options)
	{
		options.map = map;
		
		return new google.maps.Circle(options);
	};
	
	gMap.dropMarker = function(options)
	{
		options.map = map;
		
		return new google.maps.Marker(options);
	}
	
	gMap.fitBounds = function(circle)
	{
		map.fitBounds(circle.getBounds());
	}
	
	gMap.centerOnGeoloc = function(callback)
	{
		if(!map)
			return;
		
		navigator.geolocation.getCurrentPosition(
			function(position)
			{
				var loc = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
				map.setCenter(loc);
				
				if(callback)
					callback(loc);
			},
			function()
			{
				alert(messages.geoFailed);
			}
		);
	};
	
	initMap = function()
	{
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
		
		map = new google.maps.Map(mapEl[0], myOptions);
		
		// Try W3C Geolocation (Preferred)
		if(navigator.geolocation)
		{
			if(loadCallback)
				loadCallback();
		}
		// Browser doesn't support Geolocation
		else
		{
			alert(messages.geoNotAvail);
		}
	};
})(jQuery);
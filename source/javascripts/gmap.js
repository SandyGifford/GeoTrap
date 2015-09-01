var $ = require('jquery');

// TODO: this file is a little bit purpose built.  Clean it up, make a new repository for it.

var mapLoaded = false;
var mapEl;
var map;
var loadCallback;

var messages = {
  geoNotAvail : "It looks like your browser doesn't support Geolocation - try a different browser",
  geoFailed   : "Could not get Geolocation.  Do you have it disabled?"
};

var initMap;

module.exports = {
  load: function(mapElement, callback)
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
  },
  
  // Just a simplified draw circle routine
  drawRadius: function(loc, radius, color)
  {
    return this.drawCircle({
      radius        : radius     ,
      strokeColor   : color      ,
      strokeOpacity : 0.8        ,
      strokeWeight  : 2          ,
      fillColor     : color      ,
      fillOpacity   : 0.35       ,
      center        : loc
    });
  },
  
  drawCircle: function(options)
  {
    options.map = map;
    
    return new google.maps.Circle(options);
  },
  
  dropMarker: function(options)
  {
    options.map = map;
    
    return new google.maps.Marker(options);
  },
  
  fitBounds: function(circle)
  {
    map.fitBounds(circle.getBounds());
  },
  
  centerOnGeoloc: function(callback)
  {
    if(!map)
      return;
    
    navigator.geolocation.getCurrentPosition(
      function(position)
      {
        var loc = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        map.setCenter(loc);
        
        if(callback)
          callback({
            lat : position.coords.latitude  ,
            lng : position.coords.longitude
          });
      },
      function()
      {
        alert(messages.geoFailed);
      }
    );
  }
};
  
window.initMap = function()
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

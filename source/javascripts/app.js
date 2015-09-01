/*
  Gateway file to be compiled to /public/javascripts/app.js
*/

var $ = require('jquery');
var gMap = require('./gmap');




var markers = {
  player   : {},
  location : {}
};

var playerLoc        = {};
var enemyTrapMarkers = [];
var goalMarkers      = [];

var trapSize, trapLife, map, gameParams;

var buttons = {};
var score;

var map           = $("#Map")            ;

buttons.setTrap   = $("#SetTrap")        ;
buttons.counter   = $("#Counter")        ;
buttons.updatePos = $("#UpdatePosition") ;

score = $("#Score");

map.css({"height" : map.width() + "px"});

buttons.setTrap.click(postTrap);

buttons.updatePos.click(updateEverything);

disableButtons();

// For now there's no reason to not load the map from the get-go, but if this ever turns into a REST app, the ability to delay the loading of the map would be invaluable.
gMap.load(map, function(loc)
{
  mapLoaded = true;
  
  startGame(function()
  {
    updateEverything();
  });
});


function getGameInfo(callback)
{
  $.ajax({
    type    : "POST"         ,
    url     : "/gameinfo"  ,
    success : function(data)
    {
      if(callback)
        callback(data);
    }
  });
}

function startGame(callback)
{
  $.ajax({
    type    : "POST"         ,
    url     : "/gameparams"  ,
    success : function(data)
    {
      gameParams = data;
      
      if(callback)
        callback();
    }
  });
}

function disableButtons()
{
  for(var b in buttons)
    buttons[b].prop("disabled", true);
}

function enableButtons()
{
  for(var b in buttons)
    buttons[b].prop("disabled", false);
}

function postTrap()
{
  disableButtons();
  
  $.ajax({
    type    : "POST"     ,
    url     : "/settrap" ,
    data    : playerLoc  ,
    success : function(data)
    {
      console.log(data);
      
      for(var m = 0; m < enemyTrapMarkers.length; m++)
      {
        enemyTrapMarkers[m].setMap(null);
      }
      
      enemyTrapMarkers = [];
      
      for(var h = 0; h < data.hits.length; h++)
      {
        enemyTrapMarkers.push(gMap.drawRadius(data.hits[h], gameParams.trapSize, "red"));
      }
      
      updatePlayer(enableButtons);
    }
  });
}

function updateEverything()
{
  disableButtons();
  
  updateGame(function()
  {
    updateLocation(function()
    {
      updatePlayer(enableButtons);
    });
  });
}

function updateGame(callback)
{
  getGameInfo(function(data)
  {
    var goals = data.goals;
    
    for(var m = 0; m < goalMarkers.length; m++)
    {
      goalMarkers[m].setMap(null);
    }
    
    goalMarkers = [];
    
    for(var g = 0; g < goals.length; g++)
    {
      goalMarkers.push(gMap.drawRadius(
        { lat : goals[g].lat, lng : goals[g].lng },
        gameParams.goalSize, "orange"
      ));
    }
    
    if(callback)
      callback();
  });
}

function updateLocation(callback)
{
  gMap.centerOnGeoloc(function(loc)
  {
    playerLoc = loc;
    
    for(var m in markers.location)
    {
      var marker = markers.location[m];
      
      if(marker && marker.setMap)
        marker.setMap(null);
      
      delete markers.location[m];
    }
    
    markers.location.currentRadius = gMap.drawRadius(playerLoc, gameParams.trapSize, "black");
    markers.location.currentMarker = gMap.dropMarker({
      position : playerLoc,
      message  : "Current Location",
      icon     : {
        url    : "/images/anibgren.gif"       , // TODO: make my own damn image (http://www.avbuffjr.com/ani_gifs/anibgren.gif)
        size   : new google.maps.Size(10, 10) ,
        origin : new google.maps.Point(0, 0)  ,
        anchor : new google.maps.Point(5, 5)
      }
    });
    
    gMap.fitBounds(markers.location.currentRadius);
    
    if(callback)
      callback();
  });
}

function updatePlayer(callback)
{
  $.ajax({
    type    : "POST"        ,
    url     : "/playerinfo" ,
    success : function(playerInfo)
    {
      for(var m in markers.player)
      {
        var marker = markers.player[m];
        
        if(marker && marker.setMap)
          marker.setMap(null);
        
        delete markers.player[m];
      }
      
      score.text(playerInfo.score);
      
      if(playerInfo.trap)
        markers.player.trap = gMap.drawRadius(playerInfo.trap, gameParams.trapSize, "blue");
      
      if(callback)
        callback();
    }
  });
}

goog.provide('owgis.ol3');
goog.provide('owgis.ol3.geolocation');

var width;
var height;
var currPopupText;//Text of the the popup

// TODO verify how this variable works for other layers and see
// from where we can obtain the current elevation.
var elevation = 0;

//Should contain the selected start date and is used to obtain punctual
// data from the temporal data.
var startDate;

// Is used to know if the user did only click with the mouse or he/she
// panned the map
var isOnlyClick = false; 

//zoom function vars
owgis.ol3.zoomLock = 0;
var zoomDuration = 150;//in milisecons

//duration animation move to center layerDetails
var durationAnimation = 2000;

//Creates 100 layer objects
for (var i = 0; i < 100; i++) {
	eval("var layer" + i);
}

/**
 * This function is in charge of displaying the 'progress' cursor
 * when the user has requested some punctual data 
 * @returns {undefined}
 */
function setMouseClickOnMap(){

	$("#map").on('mousedown', function() { isOnlyClick = true; })
	.on('mousemove', function() { isOnlyClick = false; })
	.on('mouseup', function(){
		if(isOnlyClick){
			//Verify that the transect tools is not turned on
			if(!transectOn){
				owgis.interf.loadingatmouse(true);
			}
		}
	});
}

/*
 * Animate position
 * This function animate position and zoom on the map
 * @returns undefined
 */
function animatePositionMap(zoom, center, duration){
    duration === undefined ? durationAnimation : duration
    ol3view.animate({
                        center: center,
                        zoom: zoom,
                        duration: duration
                     });
}


function initOl3(){
	/*  -------------------- Popup.js -------------------------
	 * This file contains all the functions related with the Ol3 popup
	 */
	
    $("#popup-closer").click(function() {
		$("#popup").hide();
		$("#popup-closer").blur();
	});

	setMouseClickOnMap();
	
	/**
	 * Create an ol_popup to anchor the popup to the map.
	 */
	ol_popup = new ol.Overlay({
		element: getElementById('popup'),
		stopEvent:true//Used to not show the popup again when closing it
	});
	
	
//	var bounds = mapConfig.mapBounds;
//	var extent = mapConfig.restrictedExtent;
//	var maxRes = mapConfig.maxResolution;
//	var minRes = mapConfig.minResolution;
	
	var strCenter = mapConfig.mapcenter.split(",");
	
	var lat = 0;
	var lon = 0;
	if( strCenter[0].split("=")[0].toLowerCase() === "lat"){
		lat = Number(strCenter[0].split("=")[1]);
		lon = Number(strCenter[1].split("=")[1]);
	}else{
		lat = Number(strCenter[1].split("=")[1]);
		lon = Number(strCenter[0].split("=")[1]);
	}
	
	var changeProj;//Indicates if we need to change the projections
	var defCenter= [lon,lat];
	//var resExtent;
	if( (_map_bk_layer === "osm") || 
		(_map_bk_layer.indexOf("bing") !== -1) ||  
		(_map_bk_layer.indexOf("google") !== -1)){
		_map_projection = PROJ_3857;
		changeProj = true;
	}
    if(changeProj){
		defCenter = ol.proj.transform(defCenter, PROJ_4326, _map_projection);
		resExtent = ol.proj.transform(mapConfig.restrictedExtent.split(",").map(Number), PROJ_4326, _map_projection);//unused var
	}
    //This control is used to display Lat and Lon when the user is moving the mouse over the map
	var mousePositionControl = new ol.control.MousePosition({
		coordinateFormat: ol.coordinate.createStringXY(4),
		projection: PROJ_4326,
		// comment the following two lines to have the mouse position
		// be placed within the map.
		className: 'ol-lat-lon',
		target: getElementById('location'),
		undefinedHTML: '&nbsp;'
	});
	
	//This is the control for the scale line at the bottom of the map
	var scaleLineControl = new ol.control.ScaleLine();
	//var fullScreen = new ol.control.FullScreen();//Causes troubles with the windows <---- Unused
	//mobil config
    var loadTilesWhileAnimating = false;
    var loadTilesWhileInteracting = false;
    var nsize = 1;
    if(mobile) {
        mapConfig.zoom = 1;
        loadTilesWhileAnimating = true;
        loadTilesWhileInteracting = true;
    }
    //var defZoom = mapConfig.zoom  
    ol3view = new ol.View({
		projection: _map_projection,
		center: defCenter,
        zoom: mapConfig.zoom,
		maxZoom: mapConfig.zoomLevels,
		zoomFactor: mapConfig.zoomFactor,
		maxResolution: mapConfig.maxResolution,
        loadTilesWhileAnimating: loadTilesWhileAnimating,
        loadTilesWhileInteracting: loadTilesWhileInteracting
//		extent: resExtent  // Not working
	});
    owgis.ol3.view = ol3view;
 	map = new ol.Map({
                //interactions: ol.interaction.defaults({mouseWheelZoom:false}),
                /*.extend([
                    new ol.interaction.MouseWheelZoom({
                      constrainResolution: true, // force zooming to a integer zoom
                      duration: 1000, timeout: 500
                    })
                  ]),*/ //This is what I use to prevent the scroll wheel from zooming all the way in or out too rapidly. 
		controls: ol.control.defaults({rotate: false}).extend([mousePositionControl, scaleLineControl]),
		overlays: [ol_popup], //Overlay used for popup
		target: 'map', // Define 'div' that contains the map
        renderer: 'canvas', // ['canvas','dom','webgl']
		logo: false,
		view: ol3view
        });

	var numInFlightTiles = 0;
    map.getLayers().forEach(function (layer) {
        var source = layer.getSource();
        if (source instanceof ol.source.TileImage) {
            source.on('tileloadstart', function () {++numInFlightTiles})
            source.on('tileloadend', function () {--numInFlightTiles})
        }
    });

//////////////////// custom mouse wheel    
     /*
      * Custom listener for mouse wheel
      */
    map.on('wheel', function(mouseWheel) {
        mouseWheel.preventDefault();
        owgis.ol3.zoom(mouseWheel.originalEvent.deltaY, mouseWheel.coordinate);
    });

    /*
     * Custom efect zoom because a default zoom in open layer 3/4 presents problems
     */
    owgis.ol3.zoom = function(zoom_in, coordinate) {
        var view = ol3view;
        var delta = zoom_in < 1 ? 1 : -1;
        if(owgis.ol3.zoomLock) {
            console.log("wait to load");
            owgis.interf.loadingallscreen(true);
            return;
        }
        if(view.getZoom() + delta < 0) {
            console.log("min zoom");
            return;
        }
        owgis.ol3.zoomLock = 1;
        newResolution = view.getResolutionForZoom(view.getZoom() + delta);
        view.animate({zoom: view.getZoom() + delta, resolution: newResolution, center: view.getCenter(), duration: zoomDuration, easing: ol.easing.linear});
    };
//////////////////////// end of custom mouse wheel

    map.on('postrender', function (evt) {
        if (!evt.frameState)
            return;
        var numHeldTiles = 0;
        var wanted = evt.frameState.wantedTiles;
        for (var layer in wanted)
            if (wanted.hasOwnProperty(layer))
                numHeldTiles += Object.keys(wanted[layer]).length;
        var ready = numInFlightTiles === 0 && numHeldTiles === 0;
        if (map.get('ready') !== ready){
            map.set('ready', ready);
            /*map.addInteraction(new ol.interaction.MouseWheelZoom({
                constrainResolution: true, duration: 300, timeout: 100 // force zooming to a integer zoom
            }));
            */
            $("body").css("cursor", "default");
        }
        ////////// add next lines for custom wheel zoom
        owgis.ol3.zoomLock = 0;//unlock zoom
        owgis.interf.loadingallscreen(false);
    });

    map.set('ready', false);

    function whenMapIsReady(callback) {
        if (map.get('ready'))
            callback();
        else
            map.once('change:ready', whenMapIsReady.bind(null, callback));
    }
//////////////////////// center and zoom storage
    owgis.ol3.positionMap();

/////////////////////// custom center, zoom from layer
     var center = layerDetails.center.split(",");
     if(center[0] !== "null" && center[1] !== "null") {
        map.once('change:ready', function() {
            center = ol.proj.transform([parseInt(center[0]), parseInt(center[1])], PROJ_4326, _map_projection);
            var zoom = 'zoom' in layerDetails ? parseInt(layerDetails.zoom) : mapConfig.zoom;
            animatePositionMap(zoom, center, durationAnimation);
        });
     }
/////////////////////// add marker for geolocation
    owgis.ol3.geolocation.createMarker();
}

//TODO clean and document this function
function detectMapLayersStatus(){
	var mapLayers = map.getLayers().getArray();
	var mapDoneRendering = true;
	console.log("change in a layer");
	for(var i=0; i < mapLayers.length; i++){
		if( mapLayers[i].getSource().getState() !== "ready"){
			mapDoneRendering = false;
			break;
		}
	}

	if(mapDoneRendering){
		console.log("MAP IS READY!");
	}else{
		console.log("MAP IS NOT ready!");
	}
}

owgis.ol3.positionMap = function() {
	// --------------- Map visualization and hover texts
	var newZoom = localStorage.zoom !== undefined && localStorage.zoom <= mapConfig.zoomLevels? localStorage.zoom : ol3view.getZoom();// Zoom of map
    var newCenter = ol3view.getCenter();
	if( localStorage.map_center!== undefined){
		var strCenter = localStorage.map_center.split(",")
		var lat = Number(strCenter[0]);
		var lon = Number(strCenter[1]);
		newCenter = ol.proj.transform([lat,lon], localStorage.projection, _map_projection);// Center of the map
	}
    animatePositionMap(newZoom, newCenter, 0);
}

/************************
 * Position user on map *
 * **********************
 */

// Create a wrapper div a marker on html document
owgis.ol3.geolocation.createMarker = function() {
    var wrapp = document.createElement("div");
    wrapp.style.display = "none";
    var marker = document.createElement("div");
    marker.className = "glyphicon glyphicon-screenshot location-screenshot";
    wrapp.appendChild(marker);
    document.body.appendChild(wrapp);

    //create a marker for openlayers
    owgis.ol3.geolocation.marker = new ol.Overlay({
        positioning: 'center-center',
        element: marker,
        stopEvent: false
    });
}

//indicates if has been start search
owgis.ol3.geolocation.start = false;

//success function when try get user position 
owgis.ol3.geolocation.success = function(position) {
    var center = ol.proj.transform([position.coords.longitude, position.coords.latitude], PROJ_4326, _map_projection);
    owgis.ol3.geolocation.marker.setPosition(center);
    map.addOverlay(owgis.ol3.geolocation.marker);
    animatePositionMap(owgis.ol3.geolocation.zoom, center, owgis.ol3.geolocation.duration);
}

//error function when try get user position 
owgis.ol3.geolocation.error = function(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            console.log("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown error occurred.");
             break;
    }
}

//watcher function 
owgis.ol3.geolocation.watcher = function(position) {
    var center = ol.proj.transform([position.coords.longitude, position.coords.latitude], PROJ_4326, _map_projection);
    owgis.ol3.geolocation.marker.setPosition(center);
 }

//options for geolocation
owgis.ol3.geolocation.options = {
    enableHighAccuracy: true, 
    maximumAge        : 30000, 
    timeout           : 27000
};

//defualt zoom when get a position
owgis.ol3.geolocation.zoom = 3;

//defualt duration animation
owgis.ol3.geolocation.duration = 2000;

/*
 * Gets a position user on the map
 * if it started, and function is called, the search is stoped
 */
owgis.ol3.geolocation.getPosition = function(element) {
    if(!owgis.ol3.geolocation.start) {
        if (navigator.geolocation) {
            console.log("geolocation start");
            navigator.geolocation.getCurrentPosition(owgis.ol3.geolocation.success, 
                                                     owgis.ol3.geolocation.error,
                                                     owgis.ol3.geolocation.options);
            owgis.ol3.geolocation.watcherId = navigator.geolocation.watchPosition(
                                                    owgis.ol3.geolocation.watcher,
                                                    owgis.ol3.geolocation.error,
                                                    owgis.ol3.geolocation.options);
            owgis.ol3.geolocation.start = true;
            element.classList.add("button-click");
        } else {
            console.log("Geolocation is not supported by this browser");
        }
    } else {
        if (navigator.geolocation) {
            owgis.ol3.geolocation.start = false;
            navigator.geolocation.clearWatch(owgis.ol3.geolocation.watcherId);
            map.removeOverlay(owgis.ol3.geolocation.marker);
            element.classList.remove("button-click");
        }
    }
}


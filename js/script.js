import {initClockAt, updateClock} from '../vendors/analogclock/analogclock.js';

// global variables
var gtmap;
var borderCapitolLayer;
var earthQuakeLayer;
var earthQuakeCluster;
var wikiLayer;
var chargeLayer;
var chargeCluster;
var webcamsLayer;
var webcamsCluster;
var timeZoneOffset = 0;
var countryId;

// ########################################################################
// #                          display section                             #
// ########################################################################

function setupClock() {
	var analogClock = initClockAt('analogClock');
	setInterval(function (){
		var now = new Date();
		var utc_now = new Date(Date.UTC(now.getUTCFullYear(),
									 now.getUTCMonth(),
									 now.getUTCDate(),
									 now.getUTCHours(),
									 now.getUTCMinutes(),
									 now.getUTCSeconds(),
									 now.getUTCMilliseconds()));
		utc_now.setUTCSeconds(utc_now.getUTCSeconds() + timeZoneOffset);
		$('#ci_time').text(utc_now.toLocaleTimeString('en-GB'));
		updateClock(analogClock, utc_now);
	}, 1000);
}

function setupMap() {
	gtmap = L.map('gtmap', {
		doubleClickZoom: false,
		wheelDebounceTime: 300
	});
	gtmap.setView([51.505, -0.09], 13); // default London
	gtmap.addLayer(L.tileLayer.provider('OpenStreetMap.Mapnik'));
	borderCapitolLayer = L.featureGroup();
	earthQuakeLayer = L.featureGroup();
	earthQuakeCluster = L.markerClusterGroup();
	wikiLayer = L.featureGroup();
	chargeLayer = L.featureGroup();
	chargeCluster = L.markerClusterGroup();
	webcamsLayer = L.featureGroup();
	webcamsCluster = L.markerClusterGroup();
	gtmap.addLayer(borderCapitolLayer);
	gtmap.addLayer(earthQuakeLayer);
	gtmap.addLayer(earthQuakeCluster);
	gtmap.addLayer(wikiLayer);
	gtmap.addLayer(chargeLayer);
	gtmap.addLayer(chargeCluster);
	gtmap.addLayer(webcamsLayer);
	gtmap.addLayer(webcamsCluster);
}

// load country core information
function showCoreInfo(data) {

	// save time zone offset in global variable to be used by clock showing local time
	timeZoneOffset = data.openCage.timezone.offset_sec;

	countryId = data.countryId;

	// update map - country borders
	borderCapitolLayer.clearLayers();
	L.geoJSON(data.countryBorders, {
		style: function (feature) {
			return {
				color: "green",
				weight: 2,
				fill: false,
			};
		}
	})
	.addTo(borderCapitolLayer);
	gtmap.flyToBounds(borderCapitolLayer.getBounds());
	
	// capitol icon/marker, which can show Bootstrap modal
	var capitolIcon = L.ExtraMarkers.icon({
		icon: 'bi-geo-alt',
		markerColor: 'green',
		shape: 'circle',
		prefix: 'bi',
	  });
	L.marker(L.latLng(data.capitalCoordinates.latitude, data.capitalCoordinates.longitude), {
		icon: capitolIcon
	}).on('click', function() {
		new bootstrap.Modal(document.getElementById('countryModal')).show();
	}).addTo(borderCapitolLayer);

	// load information to Bootstrap modal
	$('.ci_countryName').text(data.countryId.countryName);
	$('#cs_countryCode').text(data.countryId.iso_a2);
	if (data.geoNames.capital!=='') {
		$('#ci_capitalHeader').text(data.geoNames.capital+', ');
		$('#ci_capitalInfo').text(data.geoNames.capital+' is the capital of ');
	} else {
		$('#ci_capitalHeader').text('');
		$('#ci_capitalInfo').text('This is ');
	}
	$('#ci_area').text((Number(data.geoNames.areaInSqKm)/1000).toFixed(0));
	$('#ci_population').text((Number(data.geoNames.population)/1000/1000).toFixed(1));
	$('#ci_timeZoneName').text(data.openCage.timezone.name);
	if (data.openCage.timezone.short_name == 'GMT') {
		$('#ci_timeZoneNameShort').text(data.openCage.timezone.short_name);
	} else {
		$('#ci_timeZoneNameShort').text(data.openCage.timezone.short_name+' or GMT'+data.openCage.timezone.offset_string);
	}
	$('#ci_driveOn').text(data.openCage.drive_on);
	$('#ci_currencyName').text(data.openCage.currency.name);
	$('.ci_currencySymbol').text(data.openCage.currency.symbol);
}

// fit map to current country boundary
$('#fitBtn').click(function() {
	gtmap.flyToBounds(borderCapitolLayer.getBounds());
});

function localisationWaitingEnable() {
	// start spinner to indicate processing to the user
	$('#locateMeBtn').prop("disabled", true);
	$('#locateMeBtn > .spinner-border').show();
	$('#locateMeBtn > i').hide();
}

function localisationWaitingDisable() {
	// stop spinner
	$('#locateMeBtn').prop("disabled", false);
	$('#locateMeBtn > .spinner-border').hide();
	$('#locateMeBtn > i').show();
}

function fittingWaitingEnable() {
	// start spinner to indicate processing to the user
	$('#fitBtn').prop("disabled", true);
	$('#fitBtn > .spinner-border').show();
	$('#fitBtn > i').hide();
}

function fittingWaitingDisable() {
	// stop spinner
	$('#fitBtn').prop("disabled", false);
	$('#fitBtn > .spinner-border').hide();
	$('#fitBtn > i').show();
}

function clearFlagLang(){
	$('#ci_flag').hide();
	$('#ci_language').text('');
}

// show country flag and language
function showFlagLang(data) {
	// load information to Bootstrap modal
	$('#ci_language').text(data.restCountries.languages[0].name);
	$('#ci_flag').attr('src', data.restCountries.flag).show();
}

function clearExchangeRates() {
	$('#ci_buyMajor').empty();
	$('#ci_sellMajor').empty();
}

// show country currency exchange rates to few major currencies
function showExchangeRates(data) {
	var base = data.exchangeRates.base;
	var symbol = $('.ci_currencySymbol').text();
	symbol = symbol.substring(0, symbol.length/2);
	for (var key in data.exchangeRates[base]){
		var infoBuy = data.exchangeRates[base][key].toPrecision(3).toLocaleString()+' '+key;
		var infoSell = data.exchangeRates[key][base].toPrecision(3).toLocaleString()+' '+symbol+' to get 1 '+key;
		$('#ci_buyMajor').append($('<li></li>').text(infoBuy));
		$('#ci_sellMajor').append($('<li></li>').text(infoSell));
	}
}

function clearHolidays(){
	$('#ci_nh_number').text('');
	$('#ci_nh_year').text('');
	$('#ci_nh').empty();
}

function monthName(number) {
	switch(number) {
		case 0: {
			return 'January';
		}
		case 1: {
			return 'February';
		}
		case 2: {
			return 'March';
		}
		case 3: {
			return 'April';
		}
		case 4: {
			return 'May';
		}
		case 5: {
			return 'June';
		}
		case 6: {
			return 'July';
		}
		case 7: {
			return 'August';
		}
		case 8: {
			return 'September';
		}
		case 9: {
			return 'October';
		}
		case 10: {
			return 'November';
		}
		case 11: {
			return 'December';
		}
	}
}

// show national holidays
function showHolidays(data) {
	var number = data.calendarific.length;
	$('#ci_nh_number').text(number);
	if (number>0) {
		$('#ci_nh_year').text(data.calendarific[0].date.datetime.year);
	}
	data.calendarific.forEach(function(holiday) {
		var datetime = holiday.date.datetime;
		var dateFormated = datetime.day + ' of ' + monthName(datetime.month-1);
		var info = dateFormated+', '+holiday.name;
		$('#ci_nh').append($('<li></li>').text(info));
	});
}

function clearCovid19() {
	var canvasConfirmed = document.getElementById("covid19_confirmed");
	var canvasRecovered = document.getElementById("covid19_recovered");
	var canvasDeaths = document.getElementById("covid19_deaths");

	context = canvasConfirmed.getContext('2d');
	context.clearRect(0, 0, canvasConfirmed.width, canvasConfirmed.height);

	context = canvasRecovered.getContext('2d');
	context.clearRect(0, 0, canvasRecovered.width, canvasRecovered.height);

	context = canvasDeaths.getContext('2d');
	context.clearRect(0, 0, canvasDeaths.width, canvasDeaths.height);

	$('#covid19_confirmed_enable').hide();
	$('#covid19_recovered_enable').hide();
	$('#covid19_deaths_enable').hide();
}

function isArrayNoneZero(array) {
	var result = false;
	array.forEach(function (item) {
		if (item != 0) {
			result = true;
		}
	});
	return result;
}

// show Covid-19 statistics
function showCovid19(data) {

	var canvasConfirmed = document.getElementById("covid19_confirmed");
	var canvasRecovered = document.getElementById("covid19_recovered");
	var canvasDeaths = document.getElementById("covid19_deaths");

	var dataConfirmed = {
		"xName": "Days",
		"yName": "Cases",
		"cols": data.covid19.days,
		"data": [
			{ 
				"name": "Confirmed", 
				"values": data.covid19.confirmedDaily
			}
		]
	};

	var dataRecovered = {
		"xName": "Days",
		"yName": "Cases",
		"cols": data.covid19.days,
		"data": [
			{ 
				"name": "Recovered", 
				"values": data.covid19.recoveredDaily
			}
		]
	};

	var dataDeaths = {
		"xName": "Days",
		"yName": "Cases",
		"cols": data.covid19.days,
		"data": [
			{ 
				"name": "Deaths", 
				"values": data.covid19.deathsDaily
			}
		]
	};
	
	if (isArrayNoneZero(data.covid19.confirmedDaily)) {
		chartify(canvasConfirmed, dataConfirmed, {
			"dataColor": "blue"
		});
		$('#covid19_confirmed_enable').show();
	}

	if (isArrayNoneZero(data.covid19.recoveredDaily)) {
		chartify(canvasRecovered, dataRecovered, {
			"dataColor": "green"
		});
		$('#covid19_recovered_enable').show();
	}

	if (isArrayNoneZero(data.covid19.deathsDaily)) {
		chartify(canvasDeaths, dataDeaths, {
			"dataColor": "black"
		});
		$('#covid19_deaths_enable').show();
	}
}

function clearNews() {
	
}

function showNews(data) {
	
}

function clearWeather() {

}

function showWeather(data) {

}

function clearAirQuality() {

}

function showAirQuality(data) {

}

function clearSolar() {
	
}

function showSolar(data) {
	
}

function clearEarthQuakes() {
	earthQuakeLayer.clearLayers();
	earthQuakeCluster.clearLayers();
}

function showEarthQuakes(data, type) {
	var eqIcon = L.ExtraMarkers.icon({
		icon: 'bi-bullseye',
		markerColor: 'red',
		shape: 'circle',
		prefix: 'bi',
	  });
	data.earthQuakesRaw.earthquakes.forEach(function(eq) {
		var marker = L.marker(L.latLng(eq.lat, eq.lng), {
			icon: eqIcon
		}).bindPopup('<h5>Earthquake</h5><p>Magnitude: '+eq.magnitude+'<br>Date: '+eq.datetime+'</p>');
		switch(type){
			case 'noCluster': {
				marker.addTo(earthQuakeLayer);
			} break;
			case 'Clustered': {
				marker.addTo(earthQuakeCluster);
			} break;
		}
	})
}

function clearWiki() {
	wikiLayer.clearLayers();
}

function showWiki(data) {
	// try https://github.com/MatthewBarker/leaflet-wikipedia
	var wikiIcon = L.ExtraMarkers.icon({
		icon: 'bi-info-circle',
		markerColor: 'yellow',
		shape: 'circle',
		prefix: 'bi',
	  });
	data.wikiRaw.geonames.forEach(function(entry) {
		L.marker(L.latLng(entry.lat, entry.lng), {
			icon: wikiIcon
		}).bindPopup('<h5>'+entry.title+'</h5><p>'+entry.summary+'</p><br><a href=https://'+entry.wikipediaUrl+' target="_blank">Click here to go to Wikipedia.org</a>')
		.addTo(wikiLayer);
	});
}

function clearCharge() {
	chargeLayer.clearLayers();
	chargeCluster.clearLayers();
}

function showCharge(data, type) {

	var chargerIcon = L.ExtraMarkers.icon({
		icon: 'bi-battery-charging',
		markerColor: 'blue',
		shape: 'circle',
		prefix: 'bi',
	  });

	data.chargeRaw.forEach(function(station) {
		var marker = L.marker(L.latLng(station.AddressInfo.Latitude, station.AddressInfo.Longitude), {
			icon: chargerIcon
		}).bindPopup('<h5>Charge station</h5><p>Usage cost: '+station.UsageCost+'<br>Connections: '+station.Connections.length+'<br>Address: '+station.AddressInfo.AddressLine1+', '+station.AddressInfo.Town+', '+station.AddressInfo.Postcode+', '+'</p>');
		switch(type){
			case 'noCluster': {
				marker.addTo(chargeLayer);
			} break;
			case 'Clustered': {
				marker.addTo(chargeCluster);
			} break;
		}
	});
	
}

function clearWebCams() {
	webcamsLayer.clearLayers();
	webcamsCluster.clearLayers();
}

function showWebCams(data, type) {

	var webcamsIcon = L.ExtraMarkers.icon({
		icon: 'bi-camera-video',
		markerColor: 'purple',
		shape: 'circle',
		prefix: 'bi',
	  });

	data.webCamsRaw.result.webcams.forEach(function(camera) {
		var popupContent;
		if (camera.player.live.available === true) {
			popupContent = '<h5>Web Camera</h5><a href='+camera.player.live.embed+' target="_blank"><img src='+camera.image.current.preview+' class="img-fluid"></a><p>Live view available';
		} else {
			popupContent = '<h5>Web Camera</h5><img src='+camera.image.current.preview+' class="img-fluid">';
		}
		var popup = L.popup({maxWidth: 500, minWidth: 300}).setContent(popupContent);
		var marker = L.marker(L.latLng(camera.location.latitude, camera.location.longitude), {
			icon: webcamsIcon
		}).bindPopup(popup);
		switch(type){
			case 'noCluster': {
				marker.addTo(webcamsLayer);
			} break;
			case 'Clustered': {
				marker.addTo(webcamsCluster);
			} break;
		}
	});

}

function clearAllClusters(){
	// this help to avoid multiple clusters overlay the map
	webcamsCluster.clearLayers();
	chargeCluster.clearLayers();
	earthQuakeCluster.clearLayers();
}

function clearAllLayers(){
	webcamsLayer.clearLayers();
	chargeLayer.clearLayers();
	wikiLayer.clearLayers()
	earthQuakeLayer.clearLayers();
}

// ########################################################################
// #                 obtaining information section                        #
// ########################################################################

$('#aboutBtn').on('click', function(){
	new bootstrap.Modal(document.getElementById('contributionsModal')).show();
});

$('#clearBtn').on('click', function(){
	clearAllLayers();
	clearAllClusters();
});

function getWebCamsByPosition(latlng) {
	clearWebCams();
	$.ajax({
		url: "php/getWebCams.php",
		type: 'POST',
		dataType: 'json',
		data: {
			type: 'coordinates',
			latitude: latlng.lat,
			longitude: latlng.lng,
		},		
		success: function(result) {
			showWebCams(result, 'noCluster');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getWebCamsByCountry(countryId) {
	clearWebCams();
	$.ajax({
		url: "php/getWebCams.php",
		type: 'POST',
		dataType: 'json',
		data: {
			type: 'country',
			countryId: countryId,
		},		
		success: function(result) {
			showWebCams(result, 'Clustered');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

$('#webCamsBtn').on('click', function(){
	clearAllClusters();
	getWebCamsByCountry(countryId);
});

function getChargeByPosition(latlng) {
	clearCharge();
	$.ajax({
		url: "php/getCharge.php",
		type: 'POST',
		dataType: 'json',
		data: {
			type: 'coordinates',
			latitude: latlng.lat,
			longitude: latlng.lng,
		},		
		success: function(result) {
			showCharge(result, 'noCluster');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getChargeByCountry(countryId) {
	clearCharge();
	$.ajax({
		url: "php/getCharge.php",
		type: 'POST',
		dataType: 'json',
		data: {
			type: 'country',
			countryId: countryId,
		},		
		success: function(result) {
			showCharge(result, 'Clustered');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

$('#chargeBtn').on('click', function(){
	clearAllClusters();
	getChargeByCountry(countryId);
});

function getWiki(latlng) {
	clearWiki();
	$.ajax({
		url: "php/getWiki.php",
		type: 'POST',
		dataType: 'json',
		data: {
			type: 'coordinates',
			latitude: latlng.lat,
			longitude: latlng.lng,
		},		
		success: function(result) {
			showWiki(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getEarthQuakesByPosition(latlng) {
	clearEarthQuakes();
	$.ajax({
		url: "php/getEarthQuakes.php",
		type: 'POST',
		dataType: 'json',
		data: {
			type: 'coordinates',
			latitude: latlng.lat,
			longitude: latlng.lng,
		},		
		success: function(result) {
			showEarthQuakes(result, 'noCluster');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getEarthQuakesByCountry(countryId) {
	clearEarthQuakes();
	var bounds = borderCapitolLayer.getBounds();
	$.ajax({
		url: "php/getEarthQuakes.php",
		type: 'POST',
		dataType: 'json',
		data: {
			type: 'country',
			countryId: countryId,
			north: bounds.getNorth(),
			south: bounds.getSouth(),
			east: bounds.getEast(),
			west: bounds.getWest(),
		},		
		success: function(result) {
			showEarthQuakes(result, 'Clustered');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

$('#earthQuakesBtn').on('click', function(){
	clearAllClusters();
	getEarthQuakesByCountry(countryId);
});

function getSolar(latlng) {
	clearSolar();
	$.ajax({
		url: "php/getSolar1.php",
		type: 'POST',
		dataType: 'json',
		data: {
			latitude: latlng.lat,
			longitude: latlng.lng,
		},		
		success: function(result) {
			showSolar(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getAirQuality(latlng) {
	clearAirQuality();
	$.ajax({
		url: "php/getAirQuality.php",
		type: 'POST',
		dataType: 'json',
		data: {
			latitude: latlng.lat,
			longitude: latlng.lng,
		},		
		success: function(result) {
			showAirQuality(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getWeather(latlng) {
	clearWeather();
	$.ajax({
		url: "php/getWeather.php",
		type: 'POST',
		dataType: 'json',
		data: {
			latitude: latlng.lat,
			longitude: latlng.lng,
		},		
		success: function(result) {
			showWeather(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getNews(countryId) {
	clearNews();
	$.ajax({
		url: "php/getNews.php",
		type: 'POST',
		dataType: 'json',
		data: {
			type: 'country',
			countryId: countryId,
		},		
		success: function(result) {
			showNews(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getCovid19(countryId) {
	clearCovid19();
	$.ajax({
		url: "php/getCovid19.php",
		type: 'POST',
		dataType: 'json',
		data: {
			countryId: countryId,
		},		
		success: function(result) {
			showCovid19(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getHolidays(countryId) {
	clearHolidays();
	var date = new Date();
	var year = date.getFullYear();
	$.ajax({
		url: "php/getHolidays.php",
		type: 'POST',
		dataType: 'json',
		data: {
			countryId: countryId,
			year: year,
		},		
		success: function(result) {
			showHolidays(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getExchangeRates(currency) {
	clearExchangeRates();
	$.ajax({
		url: "php/getExchangeRate.php",
		type: 'POST',
		dataType: 'json',
		data: {
			currency: currency,
		},		
		success: function(result) {
			showExchangeRates(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getFlagLang(countryId) {
	clearFlagLang();
	$.ajax({
		url: "php/getFlagLang.php",
		type: 'POST',
		dataType: 'json',
		data: {
			countryId: countryId,
		},		
		success: function(result) {
			showFlagLang(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getCountryInformation(data){
	showCoreInfo(data);
	getFlagLang(data.countryId);
	getExchangeRates(data.openCage.currency.iso_code);
	getHolidays(data.countryId);
	getCovid19(data.countryId);
	getNews(data.countryId);
}

// obtain country core informations based on name
function getCountryByName() {
	
	fittingWaitingEnable();

	$.ajax({
		url: "php/getCountry.php",
		type: 'POST',
		dataType: 'json',
		data: {
			type: "name",
			name: $('#countryList option:selected').text(),
			iso_a2: $('#countryList option:selected').val(),
			iso_a3: $('#countryList option:selected').attr('iso_a3'),
		},		
		success: function(result) {
			fittingWaitingDisable();
			getCountryInformation(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			fittingWaitingDisable();
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

$('#countryList').on('change', getCountryByName);

// obtain country core informations based on user's position
function getCountryByPosition() {
	
	localisationWaitingEnable();
	
	var options = {
		enableHighAccuracy: true,
		timeout: 5000,
		maximumAge: 0
	};
	function success(pos) {
		$.ajax({
			url: "php/getCountry.php",
			type: 'POST',
			dataType: 'json',
			data: {
				type: "coordinates",
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude,
			},		
			success: function(result) {
				localisationWaitingDisable();
				// select country on drop down list and update the map
				$('#countryList').val(result.countryBorders.properties.iso_a2);
				getCountryInformation(result);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				localisationWaitingDisable();
				console.log("request failed");
				console.log(jqXHR);
			}
		});
	}
	function error(err) {
		localisationWaitingDisable();
		console.warn(`ERROR(${err.code}): ${err.message}`);
	}
	window.navigator.geolocation.getCurrentPosition(success, error, options);
}

$('#locateMeBtn').on('click', getCountryByPosition);

$(window).on('load', function () {

	// map initialize
	setupMap();

	// get information about specific location
	gtmap.on('dblclick', function(event) {
		getWeather(event.latlng);
		getAirQuality(event.latlng);
		getSolar(event.latlng);
		getEarthQuakesByPosition(event.latlng);
		getWiki(event.latlng);
		getChargeByPosition(event.latlng);
		getWebCamsByPosition(event.latlng);
	});

	// get country list and populate select options
	fittingWaitingEnable();
	$.ajax({
		url: "php/getCountryList.php",
		type: 'GET',
		dataType: 'json',			
		success: function(result) {
			fittingWaitingDisable();
			result.countryList.forEach(country => {
				$('#countryList').append($('<option></option>').text(country.name)
															   .val(country.iso_a2)
															   .attr('iso_a3', country.iso_a3));
			});
			// set United Kingdom as default country
			$('#countryList').val('GB');
			var southWest = L.latLng(49.96, -7.57);
			var northEast = L.latLng(58.64,  1.68);
			var bounds = L.latLngBounds(southWest, northEast);
			gtmap.flyToBounds(bounds);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			fittingWaitingDisable();
			console.log("request failed");
			console.log(jqXHR);
		}
	});

	getCountryByPosition();

	setupClock();
	
	// display preloader
	if ($('#preloader').length) {
		$('#preloader').delay(100).fadeOut('slow', function () {
			$(this).remove();
		});
	}
});
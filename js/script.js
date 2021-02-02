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
var localLayer;
var timeZoneOffset = 0;
var countryId = {};
var earthQuakesBtn;
var chargeBtn;
var webCamsBtn;

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
	
	// load tiles from OSM
	gtmap.addLayer(L.tileLayer.provider('OpenStreetMap.Mapnik'));
	
	// prepare various layers to presents additional informations
	borderCapitolLayer = L.featureGroup();
	earthQuakeLayer = L.featureGroup();
	earthQuakeCluster = L.markerClusterGroup();
	wikiLayer = L.featureGroup();
	chargeLayer = L.featureGroup();
	chargeCluster = L.markerClusterGroup();
	webcamsLayer = L.featureGroup();
	webcamsCluster = L.markerClusterGroup();
	localLayer = L.featureGroup();
	gtmap.addLayer(borderCapitolLayer);
	gtmap.addLayer(earthQuakeLayer);
	gtmap.addLayer(earthQuakeCluster);
	gtmap.addLayer(wikiLayer);
	gtmap.addLayer(chargeLayer);
	gtmap.addLayer(chargeCluster);
	gtmap.addLayer(webcamsLayer);
	gtmap.addLayer(webcamsCluster);
	gtmap.addLayer(localLayer);

	// about, info button
	L.easyButton('bi-info-circle', function(btn, map){
		new bootstrap.Modal(document.getElementById('contributionsModal')).show();
	}).addTo(gtmap);

	// button to remove all markers from map 
	L.easyButton('bi-x-circle', function(btn, map){
		clearAllLayers();
		clearAllClusters();
	}).addTo(gtmap);

	// button to show all earth quakes in the country
	earthQuakesBtn = L.easyButton({
		states: [{
				stateName: 'ready',
				icon:      'bi-bullseye',
				title:     'Show all earth quakes in selected country',
				onClick: function(btn, map) {
					btn.state('searching');
					clearAllClusters();
					getEarthQuakesByCountry(countryId);
				}
			}, {
				stateName: 'searching',
				icon:      '<span class="spinner-border spinner-border-sm" role="status"></span>',
				title:     'searching for earth quakes ...',
		}]
	}).addTo(gtmap);

	// button to show all webcam in the country
	webCamsBtn = L.easyButton({
		states: [{
				stateName: 'ready',
				icon:      'bi-camera-video',
				title:     'Show all WebCameras in selected country',
				onClick: function(btn, map) {
					btn.state('searching');
					clearAllClusters();
					getWebCamsByCountry(countryId);
				}
			}, {
				stateName: 'searching',
				icon:      '<span class="spinner-border spinner-border-sm" role="status"></span>',
				title:     'searching for WebCameras ...',
		}]
	}).addTo(gtmap);

	// button to show all car chargers in the country
	chargeBtn = L.easyButton({
		states: [{
				stateName: 'ready',
				icon:      'bi-battery-charging',
				title:     'Show all car chargers in selected country',
				onClick: function(btn, map) {
					btn.state('searching');
					clearAllClusters();
					getChargeByCountry(countryId);
				}
			}, {
				stateName: 'searching',
				icon:      '<span class="spinner-border spinner-border-sm" role="status"></span>',
				title:     'searching for car chargers ...',
		}]
	}).addTo(gtmap);

	// news button
	L.easyButton('bi-newspaper', function(btn, map){
		new bootstrap.Modal(document.getElementById('newsModal')).show();
	}).addTo(gtmap);

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
	$('#ci_language').text(data.restCountries.language);
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
	document.getElementById('newsContainer').innerHTML = '';
}

function showNews(data) {
	data.news.forEach(function (news) {
		if (news.description != 'text/plain...') {
			news['description_enable'] = true;
		} else {
			news['description_enable'] = false;
		}
		if (news.image != 'None') {
			news['image_enable'] = true;
		} else {
			news['image_enable'] = false;
		}
	})
	const source = document.getElementById('newsTemplate').innerHTML;
	const template = Handlebars.compile(source);
	document.getElementById('newsContainer').innerHTML = template(data);
}

function clearWeather() {
	localWeather.html('');
	updateLocalPopup();
}

function showWeather(data) {
	localWeather.html('<h5>Weather</h5>');

	// define columns titles
	var row_titles = $("<tr></tr>")
		// first 3 columns
		.append($("<th></th>").text(''))
		.append($("<th></th>").text('Current'))
		.append($("<th></th>").text('+1 day'));
		// 4th and more columns
	for (var i=2; i<data.weather.length; i++) {
		row_titles.append($("<th></th>").text('+'+i+' days'));
	}
	
	// define table rows and their labels
	var rows = {};
	rows['temperature'] = $("<tr></tr>").append($("<td></td>").html('Temp<br> &deg;C'));
	rows['pressure'] = $("<tr></tr>").append($("<td></td>").html('Pressure<br>hPa'));
	rows['humidity'] = $("<tr></tr>").append($("<td></td>").html('Humidity<br>%'));
	rows['wind_speed'] = $("<tr></tr>").append($("<td></td>").html('Wind speed<br>metre/sec'));
	rows['clouds'] = $("<tr></tr>").append($("<td></td>").html('Clouds<br>%'));
	data.weather.forEach(function(point) {
		rows['temperature'].append($("<td></td>").html(point.temperature.toFixed(1)));
		rows['pressure'].append($("<td></td>").html(point.pressure.toFixed(0))); 
		rows['humidity'].append($("<td></td>").html(point.humidity.toFixed(0)));
		rows['wind_speed'].append($("<td></td>").html(point.wind_speed.toFixed(1)));
		rows['clouds'].append($("<td></td>").html(point.clouds.toFixed(0)));
	})

	// define empty table
	var table = $("<table></table>").attr("class", "table");
	// load columns titles to table
	table.append($("<thead></thead>").append(row_titles));
	// load rows to table
	var table_body = $("<tbody></tbody>");
	for (var key in rows) {
		table_body.append(rows[key]);
	}
	table.append(table_body);
	// load table to dedicated HTML element
	localWeather.append(table);

	localWeather.append('<hr>');
	updateLocalPopup();
}

function clearAirQuality() {
	airQualityWeather.html('');
	updateLocalPopup();
}

function showAirQuality(data) {
	airQualityWeather.html('<h5>Air quality: '+data.airQuality.aqius+'</h5><p>The lower index, the better, cleaner air.</p><hr>');
	updateLocalPopup();
}

function clearSolar() {
	solarWeather.html('');
	updateLocalPopup();
}

function showSolar(data) {
	solarWeather.html('<h5>Solar irradiance '+data.solar.gti.toFixed(0)+'</h5><p>The solar irradiance is provided in kWh per year. This is total solar resource available to fixed flat plate system tilted towards the equator at an angle equal to the latitude.</p>');
	updateLocalPopup();
}

function clearEarthQuakes() {
	earthQuakeLayer.clearLayers();
	earthQuakeCluster.clearLayers();
}

function showEarthQuakes(data, type) {
	clearEarthQuakes();

	var eqIcon = L.ExtraMarkers.icon({
		icon: 'bi-bullseye',
		markerColor: 'red',
		shape: 'circle',
		prefix: 'bi',
	  });
	data.earthQuakes.forEach(function(eq) {
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
	clearWiki();

	var wikiIcon = L.ExtraMarkers.icon({
		icon: 'bi-info-circle',
		markerColor: 'yellow',
		shape: 'circle',
		prefix: 'bi',
	  });
	data.wiki.forEach(function(entry) {
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
	clearCharge();

	var chargerIcon = L.ExtraMarkers.icon({
		icon: 'bi-battery-charging',
		markerColor: 'blue',
		shape: 'circle',
		prefix: 'bi',
	  });

	data.charge.forEach(function(station) {
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
	clearWebCams();

	var webcamsIcon = L.ExtraMarkers.icon({
		icon: 'bi-camera-video',
		markerColor: 'purple',
		shape: 'circle',
		prefix: 'bi',
	});

	data.webCams.forEach(function(camera) {
		var popupContent;
		if (camera.player.live.available === true) {
			popupContent = '<h5>Web Camera</h5><a href='+camera.player.live.embed+' target="_blank"><img src='+camera.image.current.preview+' class="img-fluid"></a><p>Live view available</p>';
		} else {
			popupContent = '<h5>Web Camera</h5><img src='+camera.image.current.preview+' class="img-fluid"><p>Live view NOT available</p>';
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

var localPopup = L.popup({maxWidth: 270});
var localWeather = $('<div></div>').html('');
var airQualityWeather = $('<div></div>').html('');
var solarWeather = $('<div></div>').html('');

function updateLocalPopup(){
	var localPopupContent = $('<div></div>');
	localPopupContent.append(localWeather);
	localPopupContent.append(airQualityWeather);
	localPopupContent.append(solarWeather);
	localPopup.setContent(localPopupContent.html());
}

function clearLocalMarker() {
	localLayer.clearLayers();
}

function showLocalMarker(latlng){
	clearLocalMarker();

	var localIcon = L.ExtraMarkers.icon({
		icon: 'bi-geo',
		markerColor: 'black',
		shape: 'circle',
		prefix: 'bi',
	});

	L.marker(latlng, {
		icon: localIcon
	}).bindPopup(localPopup).addTo(localLayer).openPopup();

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
	localLayer.clearLayers();
}

// ########################################################################
// #                 obtaining information section                        #
// ########################################################################

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
			webCamsBtn.state('ready');
			showWebCams(result, 'Clustered');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			webCamsBtn.state('ready');
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

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
			chargeBtn.state('ready');
			showCharge(result, 'Clustered');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			chargeBtn.state('ready');
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

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
			earthQuakesBtn.state('ready');
			showEarthQuakes(result, 'Clustered');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			earthQuakesBtn.state('ready');
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getSolar(latlng) {
	clearSolar();
	$.ajax({
		url: "php/getSolar2.php",
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
		alert('This website does not have access to your location. You can still select country from drop down menu.');
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
		clearLocalMarker();
		showLocalMarker(event.latlng);
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
			countryId.countryName = 'United Kingdom';
			countryId.iso_a2 = 'GB';
			countryId.iso_a3 = 'GBR';
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
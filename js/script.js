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
		earthQuakesBtn.state('ready');
		chargeBtn.state('ready');
		webCamsBtn.state('ready');
	}).addTo(gtmap);

	// button to show all earth quakes in the country
	earthQuakesBtn = L.easyButton({
		states: [{
				stateName: 'ready',
				icon:      'bi-bullseye',
				title:     'Show all earth quakes in selected country',
				onClick: function(btn, map) {
					clearAllClusters();
					fitMap();
					clearEarthQuakes();
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
					clearAllClusters();
					fitMap();
					clearWebCams();
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
					clearAllClusters();
					fitMap();
					clearCharge();
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

function fitMap(){
	gtmap.flyToBounds(borderCapitolLayer.getBounds());
}

function clearCoreInfo() {
	$('#ci_country_section').hide();
	$('#ci_timezone_section').hide();
}

// load country core information
function showCoreInfo(data) {
	clearCoreInfo();

	// update map - country borders and capital marker
	borderCapitolLayer.clearLayers();

	// country borders
	if (!('error' in data.countryBorders)) {
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
		fitMap();
	}
	
	// capitol icon/marker, which can show Bootstrap modal
	if (!('error' in data.capitalCoordinates)) {
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
	}

	// verify and load information to Bootstrap modal
	if (data.countryId != null) {
		if (data.countryId.countryName != null) {
			$('.ci_countryName').text(data.countryId.countryName);
		}
		if (data.countryId.iso_a2 != null) {
			$('#cs_countryCode').text(data.countryId.iso_a2);
		}
	}
	if (data.geoNames != null) {
		if (data.geoNames.capital != null) {
			if (data.geoNames.capital !== '') {
				$('#ci_capitalHeader').text(data.geoNames.capital+', ');
				$('#ci_capitalInfo').text(data.geoNames.capital+' is the capital of ');
			} else {
				$('#ci_capitalHeader').text('');
				$('#ci_capitalInfo').text('This is ');
			}
		}
		if (data.geoNames.areaInSqKm != null) {
			$('#ci_area').text((Number(data.geoNames.areaInSqKm)/1000).toFixed(0));
		}
		if (data.geoNames.population != null) {
			$('#ci_population').text((Number(data.geoNames.population)/1000/1000).toFixed(1));
		}
	}
	if (data.openCage != null) {
		if (data.openCage.timezone != null) {
			if (data.openCage.timezone.name != null) {
				$('#ci_timeZoneName').text(data.openCage.timezone.name);
			}
			if (data.openCage.timezone.short_name != null) {
				if (data.openCage.timezone.short_name == 'GMT' || data.openCage.timezone.offset_string == null) {
					$('#ci_timeZoneNameShort').text(data.openCage.timezone.short_name);
				} else {
					$('#ci_timeZoneNameShort').text(data.openCage.timezone.short_name+' or GMT'+data.openCage.timezone.offset_string);
				}
			}
		}
		if (data.openCage.drive_on != null) {
			$('#ci_driveOn').text(data.openCage.drive_on);
		}
		if (data.openCage.currency != null) {
			if (data.openCage.currency.name != null) {
				$('#ci_currencyName').text(data.openCage.currency.name);
			}
			if (data.openCage.currency.symbol != null) {
				$('.ci_currencySymbol').text(data.openCage.currency.symbol);
			}
		}
		if (data.openCage.timezone != null) {
			if (data.openCage.timezone.offset_sec != null) {
				// save time zone offset in global variable to be used by clock showing local time
				timeZoneOffset = data.openCage.timezone.offset_sec;
				$('#ci_timezone_section').show();
			}
		}
	}
	// determine if country section should be shown
	if (!('error' in data.geoNames) && !('error' in data.openCage)) {
		$('#ci_country_section').show();
	}
}

// fit map to current country boundary
$('#fitBtn').click(function() {
	fitMap();
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
	$('#ci_language_section').hide();
}

// show country flag and language
function showFlagLang(data) {
	clearFlagLang();
	// verify and load information to Bootstrap modal
	if (data.restCountries != null) {
		if (data.restCountries.flag != null) {
			$('#ci_flag').attr('src', data.restCountries.flag);
			$('#ci_flag').show();
		}
		if (data.restCountries.language != null) {
			$('#ci_language').text(data.restCountries.language);
			$('#ci_language_section').show();
		}
	}
}

function clearExchangeRates() {
	$('#ci_currency_section').hide();
}

// show country currency exchange rates to few major currencies
function showExchangeRates(data) {
	clearExchangeRates();
	if (!('error' in data.status)) {
		var base = data.exchangeRates.base;
		var symbol = $('.ci_currencySymbol').text();
		symbol = symbol.substring(0, symbol.length/2);
		$('#ci_buyMajor').empty();
		$('#ci_sellMajor').empty();
		for (var key in data.exchangeRates[base]){
			var infoBuy = data.exchangeRates[base][key].toPrecision(3).toLocaleString()+' '+key;
			var infoSell = data.exchangeRates[key][base].toPrecision(3).toLocaleString()+' '+symbol+' to get 1 '+key;
			$('#ci_buyMajor').append($('<li></li>').text(infoBuy));
			$('#ci_sellMajor').append($('<li></li>').text(infoSell));
		}
		$('#ci_currency_section').show();
	}
}

function clearHolidays(){
	$('#ci_holiday_section').hide();
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
	clearHolidays();
	var number = data.calendarific.length;
	// check if there is anything to show
	if (number > 0) {
		$('#ci_nh_number').text(number);
		$('#ci_nh_year').text(data.calendarific[0].date.datetime.year);
		$('#ci_nh').empty();
		data.calendarific.forEach(function(holiday) {
			var datetime = holiday.date.datetime;
			var dateFormated = datetime.day + ' of ' + monthName(datetime.month-1);
			var info = dateFormated+', '+holiday.name;
			$('#ci_nh').append($('<li></li>').text(info));
		});
		$('#ci_holiday_section').show();
	}
}

function clearCovid19() {
	$('#ci_covid19_section').hide();
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
	clearCovid19();

	var canvasConfirmed = document.getElementById("covid19_confirmed");
	var canvasRecovered = document.getElementById("covid19_recovered");
	var canvasDeaths = document.getElementById("covid19_deaths");

	var context = canvasConfirmed.getContext('2d');
	context.clearRect(0, 0, canvasConfirmed.width, canvasConfirmed.height);

	context = canvasRecovered.getContext('2d');
	context.clearRect(0, 0, canvasRecovered.width, canvasRecovered.height);

	context = canvasDeaths.getContext('2d');
	context.clearRect(0, 0, canvasDeaths.width, canvasDeaths.height);

	$('#covid19_confirmed_enable').hide();
	$('#covid19_recovered_enable').hide();
	$('#covid19_deaths_enable').hide();

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
	
	var confirmedDaily = isArrayNoneZero(data.covid19.confirmedDaily);
	if (confirmedDaily) {
		chartify(canvasConfirmed, dataConfirmed, {
			"dataColor": "blue"
		});
		$('#covid19_confirmed_enable').show();
	}

	var recoveredDaily = isArrayNoneZero(data.covid19.recoveredDaily);
	if (recoveredDaily) {
		chartify(canvasRecovered, dataRecovered, {
			"dataColor": "green"
		});
		$('#covid19_recovered_enable').show();
	}

	var deathsDaily = isArrayNoneZero(data.covid19.deathsDaily);
	if (deathsDaily) {
		chartify(canvasDeaths, dataDeaths, {
			"dataColor": "black"
		});
		$('#covid19_deaths_enable').show();
	}

	if (confirmedDaily || recoveredDaily || deathsDaily) {
		$('#ci_covid19_section').show();
	}
	
}

function clearNews() {
	$('#newsContainer').html('');
}

function showNews(data) {
	clearNews();
	// check if there are any news
	if (data.news.length > 0) {
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
		// use Handlebar to generate HTML
		const source = $('#newsTemplate').html();
		const template = Handlebars.compile(source);
		$('#newsContainer').html(template(data));
	} else {
		$('#newsContainer').html('<p>No News was found</p>');
	}
}

function clearWeather() {
	localWeather.html('');
	updateLocalInformations();
}

function showWeather(data) {
	clearWeather();
		if (data.weather.length > 0) {
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
		updateLocalInformations();
	}
}

function clearAirQuality() {
	airQualityWeather.html('');
	updateLocalInformations();
}

function showAirQuality(data) {
	clearAirQuality();
	if (data.airQuality.aqius != null) {
		airQualityWeather.html('<h5>Air quality: '+data.airQuality.aqius+'</h5><p>The lower index, the better, cleaner air.</p><hr>');
		updateLocalInformations();
	}
}

function clearSolar() {
	solarWeather.html('');
	updateLocalInformations();
}

function showSolar(data) {
	clearSolar();
	if (data.solar.gti != null) {
		solarWeather.html('<h5>Solar irradiance '+data.solar.gti.toFixed(0)+'</h5><p>The solar irradiance is provided in kWh per year. This is total solar resource available to fixed flat plate system tilted towards the equator at an angle equal to the latitude.</p>');
		updateLocalInformations();
	}
}

function clearEarthQuakes() {
	earthQuakeLayer.clearLayers();
	earthQuakeCluster.clearLayers();
}

function prepareEarthquakeContent(eq) {
	var earthquakeContent = '<p>Magnitude: '+eq.magnitude+'<br>Date: '+eq.datetime+'</p>';
	return earthquakeContent;
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

		// for each earthquake define own marker and attach to it eq object
		var marker = L.marker(L.latLng(eq.lat, eq.lng), {
			icon: eqIcon,
			eq: eq,
		});

		// define Popup for big screens
		var popupHeader = '<h5>Earthquake</h5>';
		var popupContent = prepareEarthquakeContent(eq);
		var popup = L.popup({maxWidth: 500, minWidth: 300}).setContent(popupHeader+popupContent);
		marker.bindPopup(popup);

		// assing on click action to each marker
		marker.on('click', function(event){
			if (isMobile()) {
				// use Bootstrap modal on small screen
				// need to close popup, because its open automaticaly
				event.target.closePopup();
				// update modal contener
				$('#earthquakeModalLabel').html('Earthquake');
				$('#earthquakeContainer').html(prepareEarthquakeContent(event.target.options.eq));
				// show modal
				new bootstrap.Modal(document.getElementById('earthquakeModal')).show();
			}
		});

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

function prepareWikiContent(entry) {
	var wikiContent = '<p>'+entry.summary+'</p><br><a href=https://'+entry.wikipediaUrl+' target="_blank">Click here to go to Wikipedia.org</a>';	
	return wikiContent;
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

		// for each wiki entry define own marker and attach to it entry object
		var marker = L.marker(L.latLng(entry.lat, entry.lng), {
			icon: wikiIcon,
			entry: entry,
		});

		// define Popup for big screens
		var popupHeader = '<h5>'+entry.title+'</h5>';
		var popupContent = prepareWikiContent(entry);
		var popup = L.popup({maxWidth: 500, minWidth: 300}).setContent(popupHeader+popupContent);
		marker.bindPopup(popup);

		// assing on click action to each marker
		marker.on('click', function(event){
			if (isMobile()) {
				// use Bootstrap modal on small screen
				// need to close popup, because its open automaticaly
				event.target.closePopup();
				// update modal contenr
				$('#wikiModalLabel').html('<h5>'+event.target.options.entry.title+'</h5>');
				$('#wikiContainer').html(prepareWikiContent(event.target.options.entry));
				// show modal
				new bootstrap.Modal(document.getElementById('wikiModal')).show();
			}
		});

		marker.addTo(wikiLayer);
	});
}

function clearCharge() {
	chargeLayer.clearLayers();
	chargeCluster.clearLayers();
}

function prepareChargeContent(station) {
	var chargeContent = '<p>Usage cost: '+station.UsageCost+'<br>Connections: '+station.Connections.length+'<br>Address: '+station.AddressInfo.AddressLine1+', '+station.AddressInfo.Town+', '+station.AddressInfo.Postcode+', '+'</p>';
	return chargeContent;
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

		// for each charge station define own marker and attach to it charge object
		var marker = L.marker(L.latLng(station.AddressInfo.Latitude, station.AddressInfo.Longitude), {
			icon: chargerIcon,
			station: station,
		});
		
		// define Popup for big screens
		var popupHeader = '<h5>Charge station</h5>';
		var popupContent = prepareChargeContent(station);
		var popup = L.popup({maxWidth: 500, minWidth: 300}).setContent(popupHeader+popupContent);
		marker.bindPopup(popup);

		// assing on click action to each marker
		marker.on('click', function(event){
			if (isMobile()) {
				// use Bootstrap modal on small screen
				// need to close popup, because its open automaticaly
				event.target.closePopup();
				// update modal contener
				$('#chargeModalLabel').html('Charge station');
				$('#chargeContainer').html(prepareChargeContent(event.target.options.station));
				// show modal
				new bootstrap.Modal(document.getElementById('chargeModal')).show();
			}
		});
		
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

function prepareWebCamsContent(camera) {
	var webCamsContent;
	if (camera.player.live.available === true) {
		webCamsContent = '<a href='+camera.player.live.embed+' target="_blank"><img src='+camera.image.current.preview+' class="img-fluid"></a><p>Live view available</p>';
	} else {
		webCamsContent = '<img src='+camera.image.current.preview+' class="img-fluid"><p>Live view NOT available</p>';
	}
	return webCamsContent;
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
		
		// for each camera define own marker and attach to it camera object
		var marker = L.marker(L.latLng(camera.location.latitude, camera.location.longitude), {
			icon: webcamsIcon,
			camera: camera,
		});

		// define Popup for big screens
		var popupHeader = '<h5>Web Camera</h5>';
		var popupContent = prepareWebCamsContent(camera);
		var popup = L.popup({maxWidth: 500, minWidth: 300}).setContent(popupHeader+popupContent);
		marker.bindPopup(popup);

		// assing on click action to each marker
		marker.on('click', function(event){
			if (isMobile()) {
				// use Bootstrap modal on small screen
				// need to close popup, because its open automaticaly
				event.target.closePopup();
				// update modal contener
				$('#webCamsModalLabel').html('Web Camera');
				$('#webCamsContainer').html(prepareWebCamsContent(event.target.options.camera));
				// show modal
				new bootstrap.Modal(document.getElementById('webCamsModal')).show();
			}
		});
		
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

function updateLocalInformations(){
	var localContent = $('<div></div>');
	localContent.append(localWeather);
	localContent.append(airQualityWeather);
	localContent.append(solarWeather);
	// update popup
	localPopup.setContent(localContent.html());
	// update modal
	$('#localInfoContainer').html(localContent.html());
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

	// define marker
	var marker = L.marker(latlng, {
		icon: localIcon,
	});
	
	// assign popup to marker and open it, if screen is big
	marker.bindPopup(localPopup);
	marker.addTo(localLayer);
	if (!isMobile()) {
		marker.openPopup();
	}
	
	// assing on click action marker and use Bootstrap modal, if screen is small
	marker.on('click', function(event){
		if (isMobile()) {
			// need to close popup, because its open automaticaly
			event.target.closePopup();			
			// show modal
			new bootstrap.Modal(document.getElementById('localInfoModal')).show();
		}
	});
	// define modal header
	$('#localInfoModalLabel').html('Local information');
	
	

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
	earthQuakeLayer.clearLayers();
	wikiLayer.clearLayers();
	localLayer.clearLayers();
}

// ########################################################################
// #                 obtaining information section                        #
// ########################################################################

function getWebCamsByPosition(latlng) {
	webCamsBtn.state('searching');
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
			webCamsBtn.state('ready');
			showWebCams(result, 'noCluster');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			webCamsBtn.state('ready');
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getWebCamsByCountry(countryId) {
	webCamsBtn.state('searching');
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
	chargeBtn.state('searching');
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
			chargeBtn.state('ready');
			showCharge(result, 'noCluster');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			chargeBtn.state('ready');
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getChargeByCountry(countryId) {
	chargeBtn.state('searching');
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
	earthQuakesBtn.state('searching');
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
			earthQuakesBtn.state('ready');
			showEarthQuakes(result, 'noCluster');
		},
		error: function(jqXHR, textStatus, errorThrown) {
			earthQuakesBtn.state('ready');
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function getEarthQuakesByCountry(countryId) {
	earthQuakesBtn.state('searching');
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
	$.ajax({
		url: "php/getSolar.php",
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

function processCoreInfo(data){
	showCoreInfo(data);
	clearFlagLang();
	clearHolidays();
	clearCovid19();
	clearNews();
	clearExchangeRates();
	// validate new country and request more data
	if (data.countryId != null) {
		countryId = data.countryId;
		if (data.countryId.countryName != null) {
			getFlagLang(data.countryId);
		}
		if (data.countryId.iso_a2 != null) {
			getHolidays(data.countryId);
			getCovid19(data.countryId);
			getNews(data.countryId);
		}
	}
	if (data.openCage != null) {
		if (data.openCage.currency != null) {
			if (data.openCage.currency.iso_code != null) {
				getExchangeRates(data.openCage.currency.iso_code);
			}
		}
	}
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
			processCoreInfo(result);
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
				processCoreInfo(result);
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
		getCountryByName();
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
		showLocalMarker(event.latlng);
		clearWeather();
		getWeather(event.latlng);
		clearAirQuality();
		getAirQuality(event.latlng);
		clearSolar();
		getSolar(event.latlng);
		clearEarthQuakes();
		getEarthQuakesByPosition(event.latlng);
		clearWiki();
		getWiki(event.latlng);
		clearCharge();
		getChargeByPosition(event.latlng);
		clearWebCams();
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

function isMobile() {
	// detect mobile: if width or height are smaller than 760px
	var width = window.matchMedia("only screen and (max-width: 760px)").matches;
	var height = window.matchMedia("only screen and (max-height: 760px)").matches;
	return (width || height);
}
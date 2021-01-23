import {initClockAt, updateClock} from './analogclock.js';

// global variables
var gtmap;
var countryBorderAndCapitol;
var timeZoneOffset = 0;

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
	countryBorderAndCapitol = L.featureGroup();
	gtmap.addLayer(countryBorderAndCapitol);
}

// load country core information
function showCoreInfo(data) {

	// save time zone offset in global variable to be used by clock showing local time
	timeZoneOffset = data.openCage.timezone.offset_sec;

	// update map - country borders
	countryBorderAndCapitol.clearLayers();
	L.geoJSON(data.countryBorders, {
		style: function (feature) {
			return {
				color: "green",
				weight: 2,
				fill: false,
			};
		}
	})
	.addTo(countryBorderAndCapitol);
	gtmap.flyToBounds(countryBorderAndCapitol.getBounds());
	
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
	}).addTo(countryBorderAndCapitol);

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
	gtmap.flyToBounds(countryBorderAndCapitol.getBounds());
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

// show country flag and language
function showFlagLang(data) {
	// load information to Bootstrap modal
	$('#ci_language').text(data.restCountries.languages[0].name);
	$('#ci_flag').attr('src', data.restCountries.flag);
}

// show country currency exchange rates to few major currencies
function showExchangeRates(data) {
	var base = data.exchangeRates.base;
	$('#ci_buyMajor').empty();
	$('#ci_sellMajor').empty();
	var symbol = $('.ci_currencySymbol').text();
	symbol = symbol.substring(0, symbol.length/2);
	for (var key in data.exchangeRates[base]){
		var infoBuy = data.exchangeRates[base][key].toPrecision(3).toLocaleString()+' '+key;
		var infoSell = data.exchangeRates[key][base].toPrecision(3).toLocaleString()+' '+symbol+' to get 1 '+key;
		$('#ci_buyMajor').append($('<li></li>').text(infoBuy));
		$('#ci_sellMajor').append($('<li></li>').text(infoSell));
	}
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
	$('#ci_nh').empty();
	data.calendarific.forEach(function(holiday) {
		var datetime = holiday.date.datetime;
		var dateFormated = datetime.day + ' of ' + monthName(datetime.month-1);
		var info = dateFormated+', '+holiday.name;
		$('#ci_nh').append($('<li></li>').text(info));
	});
}

// load detailed information about location to popup
function showDetails(data) {

}

// ########################################################################
// #                 obtaining information section                        #
// ########################################################################

function getHolidays(data) {
	var date = new Date();
	var year = date.getFullYear();
	$.ajax({
		url: "php/getHolidays.php",
		type: 'POST',
		dataType: 'json',
		data: {
			countryId: data.countryId,
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

function getExchangeRates(data) {
	$.ajax({
		url: "php/getExchangeRate.php",
		type: 'POST',
		dataType: 'json',
		data: {
			currency: data.openCage.currency.iso_code,
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

function getFlagLang(data) {
	$.ajax({
		url: "php/getFlagLang.php",
		type: 'POST',
		dataType: 'json',
		data: {
			countryId: data.countryId,
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
			showCoreInfo(result);
			getFlagLang(result);
			getExchangeRates(result);
			getHolidays(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			fittingWaitingDisable();
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

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
				showCoreInfo(result);
				getFlagLang(result);
				getExchangeRates(result);
				getHolidays(result);
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

$('#countryList').on('change', getCountryByName);

$('#locateMeBtn').on('click', getCountryByPosition);

$(window).on('load', function () {

	// map initialize
	setupMap();

	// get information about specific location
	gtmap.on('dblclick', function(event) {
		$.ajax({
			url: "php/getLocation.php",
			type: 'POST',
			dataType: 'json',
			data: {
				latitude: event.latlng.lat,
				longitude: event.latlng.lng,
			},		
			success: function(result) {
				showDetails(result);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log("request failed");
				console.log(jqXHR);
			}
		});
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
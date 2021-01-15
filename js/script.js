// global variable
let gtmap;

function fitMap() {
	gtmap.eachLayer(function(layer) {
		if (layer.getAttribution() == " ") {
			//gtmap.fitBounds(layer.getBounds());	// by jump
			gtmap.flyToBounds(layer.getBounds());	// by animation
		}
	});
}

// load country core information to map
function updateMap(data) {
	
	// clear previous country border and capitol layer and add new
	gtmap.eachLayer(function(layer) {
		if (layer.getAttribution() == " ") {
			gtmap.removeLayer(layer);
		}
	});
	var countryBorders = L.geoJSON(data.countryBorders);
	
	// creates a violet marker with the coffee icon
	var redMarker = L.ExtraMarkers.icon({
		icon: 'bi-geo-alt',
		markerColor: 'green',
		shape: 'circle',
		prefix: 'bi',
	  });
	var countryCapitol = L.marker(L.latLng(data.capitalCoordinates.latitude, data.capitalCoordinates.longitude), {icon: redMarker});
	var countryBorderAndCapitol = L.featureGroup([countryBorders, countryCapitol], {attribution: " "});
	gtmap.addLayer(countryBorderAndCapitol);

	// fit map zoom to new country border layer
	fitMap();

}

// load detailed information about location to popup
function showDetails(data) {

}

// fit map to current country boundary
$('#fitBtn').click(fitMap);

// obtain country core informations based on selected country
$('#countryList').on('change', function () {
	$.ajax({
		url: "php/getCountry.php",
		type: 'POST',
		dataType: 'json',
		data: {
			type: "name",
			name: $('#countryList option:selected').text(),
		},		
		success: function(result) {
			updateMap(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
});

// obtain country core informations based on user's position
function getCountryByPosition() {
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
				// select country on drop down list and update the map
				$('#countryList').val(result.openCage.iso_a3);
				updateMap(result);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log("request failed");
				console.log(jqXHR);
			}
		});
	}
	function error(err) {
		console.warn(`ERROR(${err.code}): ${err.message}`);
	}
	window.navigator.geolocation.getCurrentPosition(success, error, options);
}

// get user geographic location after user's action
$('#locateMeBtn').click(getCountryByPosition);

$(window).on('load', function () {
	
	// map initialize
	gtmap = L.map('gtmap');
	gtmap.setView([51.505, -0.09], 13); // default London
	gtmap.addLayer(L.tileLayer.provider('OpenStreetMap.Mapnik'));
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
	$.ajax({
		url: "php/getCountryList.php",
		type: 'GET',
		dataType: 'json',			
		success: function(result) {
			result.countryList.forEach(country => {
				$('#countryList').append($('<option></option>').text(country.name).val(country.iso_a3));
			});
			$('#countryList').val('GBR');	// default United Kingdom
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});

	// get user geographic location on page load
	getCountryByPosition();

	// display preloader
	if ($('#preloader').length) {
		$('#preloader').delay(100).fadeOut('slow', function () {
			$(this).remove();
		});
	}
});
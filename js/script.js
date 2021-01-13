// global variable
let gtmap;

function fitMap() {
	gtmap.eachLayer(function(layer) {
		if (layer.getAttribution() == "CountryBorders") {
			//gtmap.fitBounds(layer.getBounds());	// by jump
			gtmap.flyToBounds(layer.getBounds());	// by animation
		}
	});
}

// load available information to it
function updateMap(data) {
	
	// print for development purpose
	console.log("Object returned by php/getCountry.php:");
	console.log(data);
	
	// clear previous country border layer and add new
	gtmap.eachLayer(function(layer) {
		if (layer.getAttribution() == "CountryBorders") {
			gtmap.removeLayer(layer);
		}
	});
	var countryBorders = L.geoJSON(data.countryBorders.data.feature, {attribution: "CountryBorders"});
	gtmap.addLayer(countryBorders);

	// fit map zoom to new country border layer
	fitMap();
	
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
			iso_a3: $('#countryList option:selected').val(),
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
				$('#countryList').val(result.openCage.data.components['ISO_3166-1_alpha-3']);
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
	
	// get country list and populate select options
	$.ajax({
		url: "php/getCountryList.php",
		type: 'GET',
		dataType: 'json',			
		success: function(result) {
			result.data.forEach(element => {
				$('#countryList').append($('<option></option>').text(element.name).val(element.iso_a3));
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
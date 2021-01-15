<?php

	$executionStartTime = microtime(true) / 1000;

	// global variables
	$apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;

	// helper function to save copy values
	function copy_if_exist($key, $array) {
		if (array_key_exists($key, $array)) {
			return $array[$key];
		} else {
			return NULL;
		}
	}

	// ########################################################################
	// #                      https://opencagedata.com                        # 
	// #                     time zone, currency, drivign side                #
	// ########################################################################

	$openCageBaseUrl = 'https://api.opencagedata.com/geocode/v1/json?q=';

	// build OpenCage API URL
	$url = $openCageBaseUrl;
	switch($_REQUEST['type']) {
		case 'name': {
			$url .= urlencode($_REQUEST['name']);
		} break;
		case 'coordinates': {
			$url .= $_REQUEST['latitude'].'+'.$_REQUEST['longitude'];
		} break;
	}
	$url .= '&key='.$apiKeys->opencagedata;
	$url .= '&limit=1';	// limit results to one
	// request OpenCage
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['openCage']['error'] = 'Failed to get information from OpenCage';
	} else {
		$results = json_decode($response, TRUE);
		// store information
		//$output['openCageRaw'] = $results;
		$componenets = $results['results'][0]['components'];
		$output['openCage']['countryName'] = copy_if_exist('country', $componenets);
		$output['openCage']['iso_a3'] = copy_if_exist('ISO_3166-1_alpha-3', $componenets);
		$output['openCage']['iso_a2'] = copy_if_exist('ISO_3166-1_alpha-2', $componenets);
		$output['openCage']['countryCode'] = copy_if_exist('country_code', $componenets);
		$annotations = $results['results'][0]['annotations'];
		$output['openCage']['timezone'] = copy_if_exist('timezone', $annotations);
		$output['openCage']['currency'] = copy_if_exist('currency', $annotations);
		$output['openCage']['drive_on'] = copy_if_exist('drive_on', copy_if_exist('roadinfo', $annotations));
	}
	
	// ########################################################################
	// #                      countryBorders.geo.json                         #
	// #                       find country polygon                           #
	// ########################################################################

	// open file to string
    $fileString = file_get_contents("../data/countryBorders.geo.json");
    if ($fileString==FALSE) {
	    $output['countryBorders']['error'] = "unable to open JSON file";
    } else {
		// convert string (JSON) to array
        $fileArray = json_decode($fileString, TRUE);
        if ($fileArray==NULL) {
            $output['countryBorders']['error'] = "unable to decode JSON file";
        } else {
			// search array for country polygon
			switch($_REQUEST['type']) {
				// if name was provided by the request, then search array for country by name
				case 'name': {
					foreach ($fileArray['features'] as $feature) {
						if ($feature['properties']['name'] == $_REQUEST['name']) {
							// store country polygon data
							$output['countryBorders'] = $feature;
							break;
						}
					}
				} break;
				// if coordinates were provided by the request, search array for country by iso alfa 3 from OpenCage
				case 'coordinates': {
					foreach ($fileArray['features'] as $feature) {
						if ($feature['properties']['iso_a3'] == $output['openCage']['iso_a3']) {
							// store country polygon data
							$output['countryBorders'] = $feature;
							break;
						}
					}
				} break;
			}
        }
	}
	
	// ########################################################################
	// #                      https://www.geonames.org/                       # 
	// #                 capitol, population, area, bounding box              #
	// ########################################################################

	$geoNamesBaseUrl = 'http://api.geonames.org/';

	// build GeoNames API URL
	$url = $geoNamesBaseUrl;
	$url .= 'countryInfoJSON?';
	$url .= 'formatted=true';
	$url .= '&country='.urlencode($output['openCage']['countryCode']);
	$url .= '&username='.$apiKeys->geonames;
	$url .= '&style=full';

	// request GeoNames
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['geoNames']['error'] = 'Failed to get information from GeoNames';
	} else {
		$results = json_decode($response, TRUE);
		// store information
		//$output['geoNamesRaw'] = $results;
		$data = $results['geonames'][0];
		$output['geoNames']['countryName'] = copy_if_exist('countryName', $data);
		$output['geoNames']['iso_a3'] = copy_if_exist('isoAlpha3', $data);
		$output['geoNames']['capital'] = copy_if_exist('capital', $data);
		$output['geoNames']['population'] = copy_if_exist('population', $data);
		$output['geoNames']['areaInSqKm'] = copy_if_exist('areaInSqKm', $data);
		$output['geoNames']['east'] = copy_if_exist('east', $data);
		$output['geoNames']['north'] = copy_if_exist('north', $data);
		$output['geoNames']['south'] = copy_if_exist('south', $data);
		$output['geoNames']['west'] = copy_if_exist('west', $data);
	}
 
	// ########################################################################
	// #                      https://opencagedata.com                        # 
	// #                        capitol coordinates                           #
	// ########################################################################

	// build OpenCage API URL
	$url = $openCageBaseUrl;
	$url .= urlencode($output['geoNames']['capital'].', '.$output['geoNames']['countryName']);
	$url .= '&key='.$apiKeys->opencagedata;
	$url .= '&limit=1';	// limit results to one
	$url .= '&no_annotations=1'; // limit amount of information
	// request OpenCage
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['capitalCoordinates’']['error'] = 'Failed to get capitol coordinates';
	} else {
		$results = json_decode($response, TRUE);
		// store information
		//$output['capitalCoordinatesRaw'] = $results;
		$componenets = $results['results'][0]['components'];
		$output['capitalCoordinates']['countryName'] = copy_if_exist('country', $componenets);
		$output['capitalCoordinates']['iso_a3'] = copy_if_exist('ISO_3166-1_alpha-3', $componenets);
		$output['capitalCoordinates']['iso_a2'] = copy_if_exist('ISO_3166-1_alpha-2', $componenets);
		$output['capitalCoordinates']['city'] = copy_if_exist('city', $componenets);
		$geometry = $results['results'][0]['geometry'];
		$output['capitalCoordinates']['longitude'] = copy_if_exist('lng', $geometry);
		$output['capitalCoordinates']['latitude'] = copy_if_exist('lat', $geometry);
	}

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>

<?php

	$executionStartTime = microtime(true) / 1000;

	// ########################################################################
	// #                      https://opencagedata.com                        # 
	// ########################################################################

	// build OpenCage API URL
	$apiKeyOpenCage = "f0631e2c33704f14b0188e7e4f34d434";
	$urlOpenCage = 'https://api.opencagedata.com/geocode/v1/json?q=';
	switch ($_REQUEST['type']) {
		case "name": {
			$urlOpenCage .= urlencode($_REQUEST['name']);
		} break;
		case "coordinates": {
			$urlOpenCage .= $_REQUEST['latitude'].'+'.$_REQUEST['longitude'];
		} break;
	}
	$urlOpenCage .= '&key='.$apiKeyOpenCage;
	
	// request OpenCage
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $urlOpenCage);

	$result=curl_exec($ch);

	curl_close($ch);

	// convert data to PHP array
	$decode = json_decode($result, TRUE);
	$openCageResults = $decode['results'];

	// select the most relevat results
	$output['openCage']['data'] = NULL;
	if (!empty($openCageResults)){
		switch ($_REQUEST['type']) {
			// if results are from forward geocoding, there might be multiple locations found
			// thus they are verified by ISO Alfa 3 code from the request
			case "name": {
				foreach ($openCageResults as $result) {
					// if ISO Alfa 3 code exists in OpenCage results
					// e.g. Madagascar does not have this code
					if (array_key_exists('ISO_3166-1_alpha-3', $result['components'])) {
						if ($result['components']['ISO_3166-1_alpha-3'] == $_REQUEST['iso_a3']) {
							$output['openCage']['data'] = $result;
							break;
						}
					}
				}
				// if ISO Alfa 3 code is not matching or does not exist, then use most likely result is taken
				if ($output['openCage']['data'] == NULL) {
					$output['openCage']['data'] = $openCageResults[0];
				}
			} break;
			// if results are from reverse geocoding, then use most likely result is taken
			case "coordinates": {
				$output['openCage']['data'] = $openCageResults[0];
			} break;
		}
	}
	
	// ########################################################################
	// #                      countryBorders.geo.json                         # 
	// ########################################################################

	// extract country boundary polygon from JSON file
    $fileString = file_get_contents("../data/countryBorders.geo.json");
    if ($fileString==FALSE) {
        $output['ountryBorders']['status']['code'] = "404";
	    $output['countryBorders']['status']['name'] = "Not Found";
	    $output['countryBorders']['status']['description'] = "unable to open JSON file";
    } else {
		// convert JSON object to PHP array
        $fileArray = json_decode($fileString, True);
        if ($fileArray==NULL) {
            $output['countryBorders']['status']['code'] = "404";
            $output['countryBorders']['status']['name'] = "Not Found";
            $output['countryBorders']['status']['description'] = "unable to decode JSON file";
        } else {
			// search array for country polygon
			switch($_REQUEST['type']) {
				// if results are from forward geocoding, search array for country by name from the request
				case "name": {
					foreach ($fileArray['features'] as $feature) {
						if ($feature['properties']['name'] == $_REQUEST['name']) {
							$output['countryBorders']['data']['feature'] = $feature;
							break;
						}
					}
				} break;
				// if results are from reverse geocoding, search array for country by iso alfa 3 from OpenCage
				case "coordinates": {
					foreach ($fileArray['features'] as $feature) {
						if ($feature['properties']['iso_a3'] == $output['openCage']['data']['components']['ISO_3166-1_alpha-3']) {
							$output['countryBorders']['data']['feature'] = $feature;
							break;
						}
					}
				} break;
			}
			// status
            $output['countryBorders']['status']['code'] = "200";
            $output['countryBorders']['status']['name'] = "ok";
			$output['countryBorders']['status']['description'] = "JSON file read and decoded correctly";
        }
    }

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>

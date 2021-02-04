<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;
    
    // ########################################################################
	// #                      https://developer.nrel.gov                      # 
	// #                        get solar irradiance (US only)                #
	// ########################################################################

    $solarBaseUrl = 'https://developer.nrel.gov/api/solar/solar_resource/v1';
    
	// build Solar API URL
    $url = $solarBaseUrl;
    $url .= '.json?';
    $url .= '&api_key='.$apiKeys->solar->key;
	$url .= '&lat='.$_REQUEST['latitude'].'&lon='.$_REQUEST['longitude'];
    // request Solar
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// analyse response
    $output['solar']['gti'] = null;
	if ($response === FALSE) {
		$output['status']['error'] = 'Failed to get solar irradiance information';
	} else {
		// convert data to array
		$results = json_decode($response, TRUE);
        if (!(isset($results['outputs']['avg_dni']) && isset($results['outputs']['avg_lat_tilt']['annual']))) {
			$output['status']['error'] = 'Unable to decode JSON';
		} else {
			if (!($results['outputs']['avg_dni'] != 'no data')) {
				$output['status']['error'] = 'No valid data';
			} else {
				// store information
                $output['solar']['gti'] = $results['outputs']['avg_lat_tilt']['annual']*365;	// Global tilted irradiation at optimum tiltangle kWh/m^2
            }
        }
    }

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
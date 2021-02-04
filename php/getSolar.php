<?php

	$executionStartTime = microtime(true) / 1000;

	// global variables
	$output = NULL;
    
    // ########################################################################
	// #                      https://globalsolaratlas.info                   # 
	// #                        get solar irradiance                          #
	// ######################################################################## 
    
    $solarBaseUrl = 'https://api.globalsolaratlas.info/data/';
    
	// build Solar API URL
    $url = $solarBaseUrl;
    $url .= 'lta?';
    $url .= '&loc='.$_REQUEST['latitude'].','.$_REQUEST['longitude'];
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
		if (!(isset($results['annual']['data']['GTI_opta']))) {
			$output['status']['error'] = 'Unable to decode JSON';
		} else {
			// store information
			$output['solar']['gti'] = $results['annual']['data']['GTI_opta'];	// Global tilted irradiation at optimum tilt angle kWh/m^2
		}
	}

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
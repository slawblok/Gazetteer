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
	// convert data to array
	if ($response === FALSE) {
		$output['solar']['error'] = 'Failed to get solar irradiance information';
	} else {
		$results = json_decode($response, TRUE);
		// store information
		//$output['solarRaw'] = $results;
		//$output['solar']['dni'] = $results['annual']['data']['DNI'];	// Direct normal irradiation kWh/m^2
		//$output['solar']['ghi'] = $results['annual']['data']['GHI'];	// Global horizontal irradiation kWh/m^2
		//$output['solar']['dhi'] = $results['annual']['data']['DIF'];	// Diffuse horizontal irradiation kWh/m^2
		$output['solar']['gti'] = $results['annual']['data']['GTI_opta'];	// Global tilted irradiation at optimum tilt angle kWh/m^2
		//$output['solar']['tilt'] = $results['annual']['data']['OPTA'];	// Optimum tilt of PV modules degrees
	}

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
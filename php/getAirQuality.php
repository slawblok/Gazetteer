<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;
	
    // ########################################################################
	// #          https://www.iqair.com/air-pollution-data-api                # 
	// #        get air quality and polutions for given coordinates           #
	// ########################################################################

    $airvisualBaseUrl = 'https://api.airvisual.com/v2/';
    
	// build IQAir API URL
    $url = $airvisualBaseUrl;
    $url .= 'nearest_city?';
	$url .= '&lat='.$_REQUEST['latitude'].'&lon='.$_REQUEST['longitude'];
	$url .= '&key='.$apiKeys->airvisual->key;
	// request IQAir
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['airQuality']['error'] = 'Failed to get air quality information';
	} else {
		$results = json_decode($response, TRUE);
		// store information
		if ($results['status'] == 'success') {
			$output['airQuality']['aqius'] = $results['data']['current']['pollution']['aqius'];
		} else {
			$output['airQuality']['aqius'] = null;
		}
		
	}

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
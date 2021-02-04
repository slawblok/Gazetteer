<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;
	
    // ########################################################################
	// #          https://www.iqair.com/air-pollution-data-api                # 
	// #        get air quality and polutions for given coordinates           #
	// ########################################################################
	// 10,000 calls per month, but no more than 500 per day
	// True/False to reduce API usage, durign development.
    // If False, it will return fixed, dummy 999 value.
    $enable = $apiKeys->airvisual->enable;
    $airvisualBaseUrl = 'https://api.airvisual.com/v2/';
    
	// build IQAir API URL
    $url = $airvisualBaseUrl;
    $url .= 'nearest_city?';
	$url .= '&lat='.$_REQUEST['latitude'].'&lon='.$_REQUEST['longitude'];
	$url .= '&key='.$apiKeys->airvisual->key;
	$output['airQuality']['aqius'] = null;
	if ($enable) {
		// request IQAir
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
		curl_setopt($ch, CURLOPT_URL, $url);
        $response=curl_exec($ch);
		curl_close($ch);
		// analyse response
		if ($response === FALSE) {
			$output['status']['error'] = 'No response from API';
		} else {
			// convert data to array
			$results = json_decode($response, TRUE);
			if (!(isset($results['status']) && isset($results['data']['current']['pollution']['aqius']))) {
				$output['status']['error'] = 'Unable to decode JSON';
			} else {
				if ($results['status'] != 'success') {
					$output['status']['error'] = 'API did not returned information';
				} else {
					// store information
					$output['airQuality']['aqius'] = $results['data']['current']['pollution']['aqius'];
				}
			}
		}
	} else {
		$output['airQuality']['aqius'] = 999;
	}

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
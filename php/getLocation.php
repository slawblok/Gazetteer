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
	// #                     https://openweathermap.org                       # 
	// #                 get weather for given coordinates                    #
	// ########################################################################

    $openWatherMapBaseUrl = 'api.openweathermap.org/data/2.5/onecall?';
    
	// build OpenWeatherMap API URL
	$url = $openWatherMapBaseUrl;
	$url .= '&lat='.$_REQUEST['latitude'].'&lon='.$_REQUEST['longitude'];
	$url .= '&appid='.$apiKeys->openweathermap->key;
	$url .= '&exclude=minutely,hourly';	// limit amount of information
    $url .= '&units=standard';
    $url .= '&lang=en';
	// request OpenWeatherMap
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['weather']['error'] = 'Failed to get weather information';
	} else {
		$results = json_decode($response, TRUE);
		// store information
		$output['weatherRaw'] = $results;
		/*$componenets = $results['results'][0]['components'];
		$output['capitalCoordinates']['countryName'] = copy_if_exist('country', $componenets);
		$output['capitalCoordinates']['iso_a3'] = copy_if_exist('ISO_3166-1_alpha-3', $componenets);
		$output['capitalCoordinates']['iso_a2'] = copy_if_exist('ISO_3166-1_alpha-2', $componenets);
		$output['capitalCoordinates']['city'] = copy_if_exist('city', $componenets);
		$geometry = $results['results'][0]['geometry'];
		$output['capitalCoordinates']['longitude'] = copy_if_exist('lng', $geometry);
		$output['capitalCoordinates']['latitude'] = copy_if_exist('lat', $geometry);*/
	}

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
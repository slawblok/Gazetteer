<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;

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
	}

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
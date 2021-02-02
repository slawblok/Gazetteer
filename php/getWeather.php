<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;

    // ########################################################################
	// #                     https://openweathermap.org                       # 
	// #                 get weather for given coordinates                    #
	// ########################################################################

    $openWeatherMapBaseUrl = 'api.openweathermap.org/data/2.5/onecall?';
    
	// build OpenWeatherMap API URL
	$url = $openWeatherMapBaseUrl;
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
		$weather = array();
		// take current weather
		$point['temperature'] = $results['current']['temp']-273.15;
		$point['pressure'] = $results['current']['pressure'];
		$point['humidity'] = $results['current']['humidity'];
		$point['wind_speed'] = $results['current']['wind_speed'];
		$point['clouds'] = $results['current']['clouds'];
		array_push($weather, $point);
		foreach ($results['daily'] as $id => $day) {
			// take also weather for next 1-3 days
			if ($id >= 1 && $id <=3) {
				$point['temperature'] = $day['temp']['day']-273.15;
				$point['pressure'] = $day['pressure'];
				$point['humidity'] = $day['humidity'];
				$point['wind_speed'] = $day['wind_speed'];
				$point['clouds'] = $day['clouds'];
				array_push($weather, $point);
			}
		}
		$output['weather'] = $weather;
	}

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
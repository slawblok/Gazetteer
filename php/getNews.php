<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;
    
    // ########################################################################
	// #                https://currentsapi.services/en                       # 
	// #                              get news                                #
	// ########################################################################
	// 600 requests is available per day.
    $currentsApiBaseUrl = 'https://api.currentsapi.services/v1';
    
	// build Currents API URL
    $url = $currentsApiBaseUrl;
    $url .= '/latest-news';
    $url .= '?languages=en';
    //$url .= '&type=1';  // news
    $url .= '&country='.$_REQUEST['countryId']['iso_a2'];
    $url .= '&apiKey='.$apiKeys->currentsapi->key;
    
    $output['url'] = $url;

    // request Currents API
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['news']['error'] = 'Failed to get news';
	} else {
		$results = json_decode($response, TRUE);
		// store information
        $output['newsRaw'] = $results;
    }

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
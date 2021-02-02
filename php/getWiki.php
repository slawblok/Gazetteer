<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;
    
    // ########################################################################
	// #                      https://www.geonames.org/                       # 
	// #                          wikipedia links                             #
	// ########################################################################
	// There is 30,000 credits/day and 1000credits/hour in free plan.

	$geoNamesBaseUrl = 'http://api.geonames.org/';

	// build GeoNames API URL
	$url = $geoNamesBaseUrl;
	$url .= 'findNearbyWikipediaJSON?';
    $url .= '&username='.$apiKeys->geonames->username;
    $url .= '&maxRows=50';  // max 500 in free service
    $url .= '&lat='.$_REQUEST['latitude'];
    $url .= '&lng='.$_REQUEST['longitude'];
    $url .= '&radius=20';   // max 20km in free service
    
	// request GeoNames
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['wiki']['error'] = 'Failed to get information from GeoNames';
	} else {
		$results = json_decode($response, TRUE);
		// store information
		$output['wiki'] = $results['geonames'];
	}

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
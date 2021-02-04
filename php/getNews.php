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
	// True/False to reduce API usage, durign development.
	$enable = $apiKeys->currentsapi->enable;
    $currentsApiBaseUrl = 'https://api.currentsapi.services/v1';
    
	// build Currents API URL
    $url = $currentsApiBaseUrl;
    $url .= '/latest-news';
    $url .= '?languages=en';
    //$url .= '&type=1';  // news
    $url .= '&country='.$_REQUEST['countryId']['iso_a2'];
    $url .= '&apiKey='.$apiKeys->currentsapi->key;
	$output['news'] = array();
	if ($enable) {
		// request Currents API
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
		curl_setopt($ch, CURLOPT_URL, $url);
		$response=curl_exec($ch);
		curl_close($ch);
		// analyse response
		if ($response === FALSE) {
			$output['status']['error'] = 'Failed to get news';
		} else {
			// convert data to array
			$results = json_decode($response, TRUE);
			if (!(isset($results['status']) && isset($results['news']))) {
				$output['status']['error'] = 'Unable to decode JSON';
			} else {
				if ($results['status'] != 'ok') {
					$output['status']['error'] = 'API has not returned valid data';
				} else {
					// store information
					$output['news'] = $results['news'];
				}
			}
		}
	}

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;
    
    // ########################################################################
	// #                        https://api.windy.com                         # 
	// #                              get web cams                            #
	// ########################################################################

    $webCamsBaseUrl = 'https://api.windy.com/api/webcams/v2';
    
	// build Web Cams API URL
    $url = $webCamsBaseUrl;
    $url .= '/list';
    
    switch ($_REQUEST['type']){
        case 'coordinates': {
            $url .= '/nearby='.$_REQUEST['latitude'].','.$_REQUEST['longitude'];
            $url .= ',20';   // within 20km radius
        } break;
        case 'country': {
            $url .= '/country='.$_REQUEST['countryId']['iso_a2'];
        }
    }
    $url .= '/limit=50';    // max 50 in free plan
    $url .= '?key='.$apiKeys->webcams->key;
    $url .= '&show=webcams:location,image,player';
    
    // request Web Cams
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['webCams']['error'] = 'Failed to get web cams information';
	} else {
		$results = json_decode($response, TRUE);
		// store information
        if ($results['status'] == 'OK') {
            $output['webCams'] = $results['result']['webcams'];
        }
    }

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
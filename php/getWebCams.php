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
    // analyse response
    $output['webCams'] = array();
	if ($response === FALSE) {
		$output['status']['error'] = 'Failed to get web cams information';
	} else {
        // convert data to array
		$results = json_decode($response, TRUE);
        if (!(isset($results['status']) && $results['result']['webcams'])) {
            $output['status']['error'] = 'Unable to decode JSON';
        } else {
            if ($results['status'] != 'OK') {
                $output['status']['error'] = 'API has not provided valid data';
            } else {
                // store information
                $output['webCams'] = $results['result']['webcams'];
            }
        }
    }

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;
    
    // ########################################################################
	// #                      https://openchargemap.org                       # 
	// #                      get car charger locations                       #
	// ########################################################################

    $chargerBaseUrl = 'https://api.openchargemap.io/v3/poi/';
    
	// build Charger API URL
    $url = $chargerBaseUrl;
    $url .= '?key='.$apiKeys->charge->key;
    $url .= '&output=json';
    $url .= '&compact=true';
    $url .= '&verbose=false';
    $url .= '&opendata=true';
    switch ($_REQUEST['type']){
        case 'coordinates': {
            $url .= '&latitude='.$_REQUEST['latitude'].'&longitude='.$_REQUEST['longitude'];
            $url .= '&maxresults=20';
        } break;
        case 'country': {
            $url .= '&countrycode='.$_REQUEST['countryId']['iso_a2'];
            $url .= '&maxresults=250';
        }
    }
    
    // request Open Charge Map
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['charge']['error'] = 'Failed to get charging station information';
	} else {
		$results = json_decode($response, TRUE);
		// store information
        $output['chargeRaw'] = $results;
    }

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
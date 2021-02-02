<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;
    
    // ########################################################################
	// #                      https://www.geonames.org/                       # 
	// #                             earth quakes                             #
	// ########################################################################
	// There is 30,000 credits/day and 1000credits/hour in free plan.

	$geoNamesBaseUrl = 'http://api.geonames.org/';

	// build GeoNames API URL
	$url = $geoNamesBaseUrl;
	$url .= 'earthquakesJSON?';
	$url .= 'username='.$apiKeys->geonames->username;
    switch ($_REQUEST['type']){
        case 'coordinates': {
            // calculate boundary of search area(box)
            $boxSize = 100;    // unit = km, this is width in latitude and longitude directions
            $latitude = $_REQUEST['latitude'];
            $longitude = $_REQUEST['longitude'];
            $radius = 6371;    // unit = km, average Earth radius
            
            // convert km to degrees
            $boxLat = $boxSize/($radius*pi()/180);          // noth, south
            $boxLon = $boxLat/cos(deg2rad(abs($latitude))); // east, west

            $north = $latitude + $boxLat;
            $south = $latitude - $boxLat;
            $east = $longitude + $boxLon;
            $west = $longitude - $boxLon;

            $url .= '&north='.$north;
            $url .= '&south='.$south;
            $url .= '&east='.$east;
            $url .= '&west='.$west;
        } break;
        case 'country': {
            $url .= '&north='.$_REQUEST['north'];
            $url .= '&south='.$_REQUEST['south'];
            $url .= '&east='.$_REQUEST['east'];
            $url .= '&west='.$_REQUEST['west'];    
        }
    }

	// request GeoNames
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['earthQuakes']['error'] = 'Failed to get information from GeoNames';
	} else {
		$results = json_decode($response, TRUE);
		// store information
		$output['earthQuakes'] = $results['earthquakes'];
	}

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
	$output = NULL;
    
    // ########################################################################
	// #                      https://developer.nrel.gov                      # 
	// #                        get solar irradiance (US only)                #
	// ########################################################################

    $solarBaseUrl = 'https://developer.nrel.gov/api/solar/solar_resource/v1';
    
	// build Solar API URL
    $url = $solarBaseUrl;
    $url .= '.json?';
    $url .= '&api_key='.$apiKeys->solar->key;
	$url .= '&lat='.$_REQUEST['latitude'].'&lon='.$_REQUEST['longitude'];
        
    // request Solar
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['solar']['error'] = 'Failed to get solar irradiance information';
	} else {
		$results = json_decode($response, TRUE);
		// store information
        //$output['solarRaw'] = $results;
        if ($results['outputs']['avg_dni'] != 'no data') {
            $dni = $results['outputs']['avg_dni']['annual']*365;	
            $ghi = $results['outputs']['avg_ghi']['annual']*365;	
            $latitude = $_REQUEST['latitude'];
            $dhi = $ghi - ($dni*cos(deg2rad(abs($latitude)))); // GHI is geometric sum of DNI and DHI
            $tilt = abs($latitude);
            //$output['solar']['dni'] = $dni; // Direct normal irradiation kWh/m^2
            //$output['solar']['ghi'] = $ghi; // Global horizontal irradiation kWh/m^2
            //$output['solar']['dhi'] = $dhi; // Diffuse horizontal irradiation kWh/m^2
            $output['solar']['gti'] = $results['outputs']['avg_lat_tilt']['annual']*365;	// Global tilted irradiation at optimum tiltangle kWh/m^2
            //$output['solar']['tilt'] = $tilt;	// Optimum tilt of PV modules degrees -> related to latitude
        } else {
            //$output['solar']['dni'] = null;
            //$output['solar']['ghi'] = null;
            //$output['solar']['dhi'] = null;
            $output['solar']['gti'] = null;
            //$output['solar']['tilt'] = null;
        }
    }

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
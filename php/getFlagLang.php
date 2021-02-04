<?php

    $executionStartTime = microtime(true) / 1000;

    // global variables
    $output = NULL;

    // helper function to save copy values
	function copy_if_exist($key, $array) {
		if (array_key_exists($key, $array)) {
			return $array[$key];
		} else {
			return NULL;
		}
    }
    
    // ########################################################################
	// #                      https://restcountries.eu                        #
	// #                          flag and language                           #
	// ########################################################################

	$restCountriesBaseUrl = 'https://restcountries.eu/rest/v2/';

	// build REST Countries API URL
    $url = $restCountriesBaseUrl;
    if (array_key_exists('iso_a3', $_REQUEST['countryId'])) {
        $url .= 'alpha/';
        $url .= $_REQUEST['countryId']['iso_a3'];
    } else {
        $url .= 'name/';
        $url .= urlencode($_REQUEST['countryId']['countryName']);
        $url .= '?fullText=true';
	}
	// request REST Countries
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	// analyse response
	$output['restCountries'] = null;
	if ($response === FALSE) {
		$output['status']['error'] = 'No response from API';
	} else {
		// convert data to array
		$results = json_decode($response, TRUE);
		if (!isset($results)) {
			$output['status']['error'] = 'Unable to decode JSON';
		} else {
			// store information
			$output['restCountries']['countryName'] = copy_if_exist('name', $results);
			$output['restCountries']['iso_a3'] = copy_if_exist('alpha2Code', $results);
			$output['restCountries']['iso_a2'] = copy_if_exist('alpha3Code', $results);
			$output['restCountries']['flag'] = copy_if_exist('flag', $results);
			if (!isset($results['languages'][0])) {
				$output['status']['error'] = 'No languages';
			} else {
				$output['restCountries']['language'] = copy_if_exist('name', $results['languages'][0]);
			}
		}
    }

    $output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output);
    
?>
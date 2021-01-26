<?php

	$executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
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
	// #                      https://covid19api.com/                         # 
	// #                         COVID-19 statistic                           #
	// ########################################################################

    $covid19BaseUrl = 'https://api.covid19api.com/';
    
    // obtain country list from the API
    // this is needed to find country slug based on ISO Alfa 2 code

	// build Covid-19 API URL
	$url = $covid19BaseUrl;
	$url .= 'countries';
	// request build Covid-19 API URL
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
	$response=curl_exec($ch);
	curl_close($ch);
	$slug = null;
	if ($response === FALSE) {
		$output['covid19']['error'] = 'Failed to get list of countries';
	} else {
		// convert data to array
		$countries = json_decode($response, TRUE);
		// find country slug baed on ISO Alfa 2 code
		foreach($countries as $countrie) {
			if ($countrie['ISO2'] === $_REQUEST['countryId']['iso_a2']) {
				$slug = $countrie['Slug'];
				$output['covid19']['slug'] = $slug;
				break;
			}
		}
	}

	// once the slug was determined succesfuly, then request covid-19 data
	if (!is_null($slug)) {

		// build Covid-19 API URL
		$url = $covid19BaseUrl;
		$url .= 'total/dayone/country/';
		$url .= $slug;
		// request build Covid-19 API URL
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
		curl_setopt($ch, CURLOPT_URL, $url);
		$response=curl_exec($ch);
		curl_close($ch);
		if ($response === FALSE) {
			// convert data to array
			$output['covid19']['error'] = 'Failed to get covid-19 data';
		} else {
			$data = json_decode($response, TRUE);
			// take only last 30 days and calculate daily change
			$end = count($data)-1;
			$start = $end-30;
			$days = array();
			$confirmedDaily = array();
			$recoveredDaily = array();
			$deathsDaily = array();
			for ($i = $start; $i <= $end; $i++) {
				// prepare labels for x axis
				$k = $end-$i;
				if (($k % 15 == 0)) {
					array_push($days, $k.' days ago');
				} else {
					array_push($days, '');
				}
				// calculate daily change of confirmed cases
				array_push($confirmedDaily, $data[$i]['Confirmed'] - $data[$i-1]['Confirmed']);
				// calculate daily change of recovered cases
				array_push($recoveredDaily, $data[$i]['Recovered'] - $data[$i-1]['Recovered']);
				// calculate daily change of deaths cases
				array_push($deathsDaily, $data[$i]['Deaths'] - $data[$i-1]['Deaths']);
			}
			// store data
			$days[count($days)-1] = 'today';
			$output['covid19']['days'] = $days;
			$output['covid19']['confirmedDaily'] = $confirmedDaily;
			$output['covid19']['recoveredDaily'] = $recoveredDaily;
			$output['covid19']['deathsDaily'] = $deathsDaily;
			
		}
	}


    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
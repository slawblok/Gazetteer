<?php

    function console_log( $data ){
        echo '<script>';
        echo 'console.log('. json_encode( $data ) .')';
        echo '</script>';
    }

    $executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
    $output = NULL;

    // ########################################################################
	// #                   https://calendarific.com                           #
    // #                            holidays                                  #
	// ########################################################################
    // There is 1000 requests/month in free plan.
    // True/False to reduce API usage, durign development.
    // If False, it will return fixed, dummy rates.
    $enable = $apiKeys->calendarific->enable;

	$calendarificBaseUrl = 'https://calendarific.com/api/v2';

	// build Calendarific API URL
    $url = $calendarificBaseUrl;
    $url .= '/holidays?';
    $url .= 'api_key='.$apiKeys->calendarific->key;
    $url .= '&country='.$_REQUEST['countryId']['iso_a2'];
    $url .= '&year='.$_REQUEST['year'];
	// request Open Exchange Rate
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
    $response = TRUE;
    if ($enable) {
        $response=curl_exec($ch);
    }
    curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['calendarific']['error'] = 'Failed to get holidays';
	} else {
        // store information
        $results = NULL;
        $nationalHolidays = array();
        if ($enable) {
            $results = json_decode($response, TRUE);
            $holidays = $results['response']['holidays'];
            // filter result by 'National holiday'
            foreach($holidays as $holiday) {
                if ($holiday['type'][0] === 'National holiday'){
                    array_push($nationalHolidays, $holiday);
                }
            }
        }
        $output['calendarific']=$nationalHolidays;
        //$output['calendarificRaw'] = $results;   
    }

    $output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output);
    
?>
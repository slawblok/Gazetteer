<?php

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
    $enable = $apiKeys->calendarific->enable;

	$calendarificBaseUrl = 'https://calendarific.com/api/v2';

	// build Calendarific API URL
    $url = $calendarificBaseUrl;
    $url .= '/holidays?';
    $url .= 'api_key='.$apiKeys->calendarific->key;
    $url .= '&country='.$_REQUEST['countryId']['iso_a2'];
    $url .= '&year='.$_REQUEST['year'];
    $nationalHolidays = array();
    // request Calendarific
    if ($enable) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_URL, $url);
        $response=curl_exec($ch);
        curl_close($ch);
        // analyse response
        if ($response === FALSE) {
            $output['status']['error'] = 'Failed to get holidays';
        } else {
            // convert data to array
            $results = json_decode($response, TRUE);
            if (!(isset($results['response']['holidays']))) {
                $output['status']['error'] = 'Unable to decode JSON';
            } else {
                $holidays = $results['response']['holidays'];
                // filter result by 'National holiday'
                foreach($holidays as $holiday) {
                    foreach($holiday['type'] as $type) {
                        if($type === 'National holiday') {
                            array_push($nationalHolidays, $holiday);
                            break;
                        }
                    }
                }
            }
        }
    }
    // store information
    $output['calendarific']=$nationalHolidays;

    $output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output);
    
?>
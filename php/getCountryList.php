<?php

    $executionStartTime = microtime(true) / 1000;
    
    // global variable
    $output = NULL;

    // ########################################################################
	// #                      countryBorders.geo.json                         #
	// #                 extract country list from JSON file                  #
	// ########################################################################

    // helper function to sort multi-dimensional array 
    function compareMethod($a, $b) {
        return strcmp($a["name"], $b["name"]);
    }

    // open file to string
    $fileString = file_get_contents("../data/countryBorders.geo.json");
    if ($fileString==FALSE) {
        $output['status']['code'] = "404";
	    $output['status']['name'] = "Not Found";
	    $output['status']['description'] = "unable to open JSON file";
    } else {
        // convert JSON string to array
        $fileArray = json_decode($fileString, True);
        if ($fileArray==NULL) {
            $output['status']['code'] = "404";
            $output['status']['name'] = "Not Found";
            $output['status']['description'] = "unable to decode JSON file";
        } else {
            // build country list
            $countryList = array();
            foreach ($fileArray['features'] as $feature) {
                // remove unnecesary data
                unset($feature['properties']['iso_n3']);
                // add remaining data to array
                array_push($countryList, $feature['properties']);
            }
            // sort the list
            usort($countryList, 'compareMethod');
            $output['countryList'] = $countryList;
            $output['status']['code'] = "200";
            $output['status']['name'] = "ok";
            $output['status']['description'] = "Country list was decoded from JSON file";
        }
    }
    
    $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>

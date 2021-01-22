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
	// #                   https://openexchangerates.org/                     #
	// #                            exchange rate                             #
	// ########################################################################

	$exchangeRateBaseUrl = 'https://openexchangerates.org/api/';

    $baseCurrency = $_REQUEST['currency'];
    $majorCurrencies = array('USD', 'GBP', 'EUR', 'CHF');

	// build Open Exchange Rate API URL
    $url = $exchangeRateBaseUrl;
    $url .= 'latest.json?';
    $url .= 'app_id='.$apiKeys->openexchangerates;
    $url .= '&symbols='.$baseCurrency;
    foreach($majorCurrencies as $major) {
        $url .= ','.$major;
    }
	// request Open Exchange Rate
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_URL, $url);
    $response=curl_exec($ch); // NOTE: commented out to reduce API usage
    curl_close($ch);
	// convert data to array
	if ($response === FALSE) {
		$output['exchangeRates']['error'] = 'Failed to get exchange rates';
	} else {
		$results = json_decode($response, TRUE);
		// store information
        //$output['exchangeRatesRaw'] = $results;
        // calculate exchange rate between country currency and other major currencies
        // NOTE: OpenExchengeRates provides only exchange to USD in free plan;
        // thus the exchange rate is calculated as follow:
        // country currency -> USD -> desire major currency
        $rates = $results['rates']; // NOTE: commented out to reduce API usage
        foreach($majorCurrencies as $major) {
            if ($major != $baseCurrency) {
                $exchange = $rates[$baseCurrency]/$rates[$major]; // NOTE: commented out to reduce API usage
                $output['exchangeRates'][$major][$baseCurrency] = $exchange;
                $output['exchangeRates'][$baseCurrency][$major] = 1/$exchange;
            }
        }
        $output['exchangeRates']['base'] = $baseCurrency;
    }

    $output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output);
    
?>
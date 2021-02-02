<?php

    $executionStartTime = microtime(true) / 1000;

    // global variables
    $apiKeys = json_decode(file_get_contents("APIKeys.json"));
    $output = NULL;

    // ########################################################################
	// #                   https://openexchangerates.org/                     #
    // #                            exchange rate                             #
	// ########################################################################
    // There is 1000 requests/month in free plan.
    // True/False to reduce API usage, durign development.
    // If False, it will return fixed, dummy rates.
    $enable = $apiKeys->openexchangerates->enable;

	$exchangeRateBaseUrl = 'https://openexchangerates.org/api/';

    $baseCurrency = $_REQUEST['currency'];
    $majorCurrencies = array('USD', 'GBP', 'EUR', 'CHF');

	// build Open Exchange Rate API URL
    $url = $exchangeRateBaseUrl;
    $url .= 'latest.json?';
    $url .= 'app_id='.$apiKeys->openexchangerates->key;
    $url .= '&symbols='.$baseCurrency;
    foreach($majorCurrencies as $major) {
        $url .= ','.$major;
    }
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
		$output['exchangeRates']['error'] = 'Failed to get exchange rates';
	} else {
        $results = NULL;
        $rates = NULL;
        if ($enable) {
            $results = json_decode($response, TRUE);
            $rates = $results['rates'];
        }
		// store information
        // calculate exchange rate between country currency and other major currencies
        // NOTE: OpenExchengeRates provides only exchange to USD in free plan;
        // thus the exchange rate is calculated as follow:
        // country currency -> USD -> desire major currency
        foreach($majorCurrencies as $major) {
            if ($major != $baseCurrency) {
                $exchange = 1;
                if ($enable) {
                    $exchange = $rates[$baseCurrency]/$rates[$major];
                }
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
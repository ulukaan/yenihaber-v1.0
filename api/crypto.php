<?php
global $bp_options;
if (!class_exists('DataCache')) {
    include 'DataCache.php';
}
include 'currency.php';

if(empty($bp_options['proxyURL'])) {
    $bp_options['proxyURL'] = "";
}

$DataCache = new DataCache(30);
if($DataCache->get("coingecko")) {
    $coin_data = $DataCache->get("coingecko");
} else {
    $source = get_url_curl("https://api.coingecko.com/api/v3/coins/markets?vs_currency=try&order=market_cap_desc&per_page=100&page=1&sparkline=false");
    $coingecko = json_decode($source, true);
    foreach ($coingecko as $key => $value) {
        $coin_data['symbol'][$value['symbol']]        = $value['symbol'];
        $coin_data['name'][$value['symbol']]          = $value['name'];
        $coin_data['current_price'][$value['symbol']] = $value['current_price'];
        $coin_data['price_24h'][$value['symbol']]     = $value['price_change_percentage_24h'];
        $coin_data['last_updated'][$value['symbol']]  = explode(":", explode("T", $value['last_updated'])[1])[0] . ":" . explode(":", explode("T", $value['last_updated'])[1])[1];
        $coin_data['change_rate'][$value['symbol']]   = $value['ath_change_percentage'];
        $coin_data['suply'][$value['symbol']]   = $value['circulating_supply'];
        $coin_data['image'][$value['symbol']]   = $value['image'];
    }
    $DataCache->write("coingecko", $coin_data);
}
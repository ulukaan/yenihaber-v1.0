<?php
include 'api_helper.php';
$altin_data = get_data_service("altin");
$altin_data = json_encode($altin_data, true);
$altin_data = json_decode(str_replace(
    ['\u8139', 'altin-ons', '\uff83-yrek', 'alt\uff84\uff71n'],
    ['i', 'ons-altin-usd', 'ceyrek', 'altin'],
    $altin_data
), true);

$currency_data = get_data_service("currency");

$parite_data = get_data_service("parite");

$borsa_data = get_data_service("borsa");

$bist100_data = $borsa_data['bist_100'];
$borsa_artanlar_data = $borsa_data['borsa_artanlar'];
$borsa_azalanlar_data = $borsa_data['borsa_azalanlar'];
$borsa_islem_gorenler_data = $borsa_data['borsa_islem_gorenler'];
$hisse = $borsa_data['hisse'];

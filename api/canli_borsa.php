<?php
include 'api_helper.php';
error_reporting(0);
$hour = date("H")-2;
$canli_borsa = get_url_curl("http://83.66.162.176/c/rt_data.asp?yil=%20".date("Y")."&ay=".date("m")."&gun=".date("d")."&saat=".$hour."&dakika=".date("i")."&saniye=35&rnd=8909457010");
preg_match_all('@"data" : "(.*?)"@si', $canli_borsa, $data_area);
$data = explode("~", $data_area[1][0]);
unset($data[0]);
unset($data[420]);
foreach ($data as $key => $value) {
    $exp_val = explode("|", $value);
    $new_data[$exp_val[0]] = array(
        'fiyat' => number_format($exp_val[1], 2),
        'hisse' => $exp_val[2],
        'zaman' => $exp_val[3],
    );
}

echo json_encode($new_data, true);

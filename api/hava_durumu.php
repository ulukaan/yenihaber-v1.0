<?php

include 'api/api_helper.php';
include 'hava-durumu-sehir-codes.php';

if (!function_exists('hava_durumu_icon')) {
	function hava_durumu_icon($type)
	{
		$array_list = [
			'bulutlu' => 27,
			'bkn_d' => 49,
			'bkn_n' => 49,
			'skc_d' => 33,
			'skc_n' => 33,
			'parcali-bulutlu' => 27,
			'saganak-yagisli' => '05',
			'karla-karisik-yagmur' => 19,
			'saganak-kar-yagisli' => 17,
			'yagmurlu' => 12,
			'kismen-gunesli-saganak-yagisli' => 41
		];
		
		if (isset($array_list[$type])) {
			return $array_list[$type];
		} else {
			return 27;
		}
	}
}

if (!lisans_ekstra()) {
	die();
}

global $temp, $nem, $ruzgar, $hava, $temp_data, $nem_data, $status, $ruzgar, $gun_data, $sehir_isim, $gun_grafik, $basinc, $gorus, $icon_last_plaka, $degree_plaka, $current_sehir, $hourly_degree, $hourly_data;
$sehir = explode("-", $wp->request)[0];
$title_sehir = mb_ucfirst($sehir, "UTF-8");

$_GET['sehir'] = $title_sehir;
if (empty($title_sehir) || $sehir == "hava") {
	$title_sehir = plaka_to_sehir($current_sehir);
	$_GET['sehir'] = 'istanbul';
}



if (empty($_GET['sehir'])) {
	$hava = get_url_curl($ad = "https://www.milliyet.com.tr/hava-durumu/istanbul/");
	$sehir_isim = "İstanbul";
} else {
	$sehir = permalink($_GET['sehir']);
	$hava = get_url_curl($ad = "https://www.milliyet.com.tr/hava-durumu/" . $sehir . "/");
	$sehir_isim = $_GET['sehir'];
}

$sehir_isim = sehir_replace($_GET['sehir']);

preg_match_all('@<strong>(.*?)°</strong>@si', $hava, $temp);
preg_match_all('@<div class="city-card__weather-description"><strong>(.*?)</strong></div>@si', $hava, $status);
$status[2][0] = $status[1][0];

preg_match_all('@<div class="city-card__weather-icon"><img src="https://yastatic.net/weather/i/icons/blueye/color/svg/(.*?).svg" /></div>@si', $hava, $icon);
preg_match_all('@<div class="city-card__detail city-card__detail--humidity">                <span>Nem Oranı</span>                <strong>(.*?)%</strong>            </div>@si', $hava, $nem);
preg_match_all('@<div class="city-card__detail city-card__detail--windvel">                <span>Rüzgar Hızı</span>                <strong>(.*?)Kph</strong>            </div>@si', $hava, $ruzgar);
preg_match_all('@<div class="city-card__detail city-card__detail--pressure">                <span>Basınç</span>                <strong>(.*?)</strong>            </div>@si', $hava, $basinc);
preg_match_all('@<div class="city-card__detail city-card__detail--winddir">                <span>Rüzgar Yönü</span>                <strong>(.*?)</strong>            </div>@si', $hava, $gorus);
preg_match_all('@<strong class="city-forecasts__today-hour">(.*?)</strong>                                    <img src="https://yastatic.net/weather/i/icons/blueye/color/svg/(.*?).svg" class="city-forecasts__today-icon" />                                    <div class="city-forecasts__today-temperature">                                        <strong>(.*?)°</strong><span><sup>(.*?)</sup></span>                                    </div>                                    <div class="city-forecasts__today-description">(.*?)</div>                                </div>@si', $hava, $hourly_data);
preg_match_all('@<strong class="city-forecasts__today-hour city-forecasts__today-hour--date">(.*?)</strong>                                <span class="city-forecasts__today-day">(.*?)</span>                                <img src="https://yastatic.net/weather/i/icons/blueye/color/svg/(.*?).svg" class="city-forecasts__today-icon" />                                <div class="city-forecasts__today-temperature">                                    <strong>(.*?)°</strong><span><sup>(.*?)</sup></span>                                </div>                                <div class="city-forecasts__today-description">(.*?)</div>@si', $hava, $gun_data);

foreach ($gun_data as $key => $gun) {
	$gun_grafik[1][] = "'" . $gun_data[1][$key] . "'";
	$gun_grafik[2][] = "'" . $gun_data[4][$key] . "'";
}


$icon_last = hava_durumu_icon($icon[1][0]);
foreach($hourly_data[1] as $key=>$data) {
	$hourly_data[1][$key] = "'{$data}'";
}

if (!function_exists('get_specific_city_hava_durumu')) {
	function get_specific_city_hava_durumu($city)
	{
		$sehir = permalink($city);
		
		$hava = get_url_curl($ad = "https://www.milliyet.com.tr/hava-durumu/" . ($sehir) . "/");
		preg_match_all('@<strong>(.*?)°</strong>@si', $hava, $temp);
		preg_match_all('@<div class="city-card__weather-description"><strong>(.*?)</strong></div>@si', $hava, $status);
		$status[2][0] = $status[1][0];
		preg_match_all('@<div class="city-card__weather-icon"><img src="https://yastatic.net/weather/i/icons/blueye/color/svg/(.*?).svg" /></div>@si', $hava, $icon);
		preg_match_all('@<div class="info">                        <span class="icon">                                                        <img src="https://im.haberturk.com/assets/images/weather/icons/colored/(.*?).svg" alt="">                        </span>                        <span class="description">(.*?)</span>                    </div>@si', $hava, $status);
		preg_match_all('@<img alt="Nem Oranı" src="https://im.haberturk.com/assets/images/weather/v1/icons/icon-nem.svg" alt="Bulutlu" />(.*?)%</span>@si', $hava, $nem);
		preg_match_all('@<span class="description"><img alt="Rüzgar Hızı" src="https://im.haberturk.com/assets/images/weather/v1/icons/icon-ruzgar-hizi.svg" alt="Bulutlu" />(.*?)KM</span>@si', $hava, $ruzgar);
		preg_match_all('@<li>                    <span class="title">(.*?)</span>                    <span class="img">                                                <img src="https://im.haberturk.com/assets/images/weather/icons/colored/(.*?).svg" alt="">                    </span>                    <div class="degree">                        <span class="high-degree">(.*?)°</span>                        <span class="low-degree">(.*?)°</span>                    </div>                </li>@si', $hava, $gun_data);
		preg_match_all('@<div class="detail">                                <span class="time">(.*?)</span>                                <span class="degree">(.*?)°</span>                            </div>@si', $hava, $hourly_degree);
		
		return [
			'temp' => $temp[1][0],
			'icon' => hava_durumu_icon(str_replace('.','',$icon[1][0])),
		];
	}
}

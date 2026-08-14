<?php
include 'api/api_helper.php';

if (!class_exists('DataCache')) {
    include 'DataCache.php';
}

$DataCache = new DataCache(30);

date_default_timezone_set('Europe/Istanbul');

if (!lisans_ekstra()) {
    die();
}

if (!function_exists("tr_to_en_month")) {
    function tr_to_en_month($str)
    {
        $ing_aylar = array("January", "February", "March", "May", "April", "June", "July", "August", "September", "October", "November", "December");
        $tr_aylar = array("Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık");

        return str_replace($tr_aylar, $ing_aylar, $str);
    }
}

include '../inc/NamazVakitleri.php';

global $wp;
$sehir = explode("-", $wp->request)[0];
$title_sehir = mb_ucfirst($sehir, "UTF-8");

foreach (BirtemaHelper::getNamazCityList() as $key => $city) {

    if (mb_strtolower($city) == $sehir) {
        $_GET['id'] = $key;
        break;
    }
}
function date_getFullTimeDifference($start, $end)
{
    $uts['start'] = ($start);
    $uts['end'] = ($end);
    if ($uts['start'] !== -1 && $uts['end'] !== -1) {
        if ($uts['end'] >= $uts['start']) {
            $diff = $uts['end'] - $uts['start'];
            if ($years = intval((floor($diff / 31104000))))
                $diff = $diff % 31104000;
            if ($months = intval((floor($diff / 2592000))))
                $diff = $diff % 2592000;
            if ($days = intval((floor($diff / 86400))))
                $diff = $diff % 86400;
            if ($hours = intval((floor($diff / 3600))))
                $diff = $diff % 3600;
            if ($minutes = intval((floor($diff / 60))))
                $diff = $diff % 60;
            $diff = intval($diff);
            return (array('years' => $years, 'months' => $months, 'days' => $days, 'hours' => $hours, 'minutes' => $minutes, 'seconds' => $diff));
        } else {
            //echo "Ending date/time is earlier than the start date/time";
        }
    } else {
        //echo "Invalid date/time data detected";
    }
}

global $sehir_isim, $return_data, $current_sehir, $bp_options;

$_GET['sehir'] = $title_sehir;
if (empty($title_sehir) || $sehir == "namaz") {
    $title_sehir = plaka_to_sehir($current_sehir);
    $_GET['sehir'] = plaka_to_sehir($current_sehir);
}

if (empty(@$_GET['id'])) {
    $namazCityId = $bp_options['namazCityLink'];
} else {
    $namazCityId = $_GET['id'];
}

if (empty($bp_options['proxyURL'])) {
    $bp_options['proxyURL'] = "";
}


$cache_key = "namaz_vakitleri_" . $namazCityId;
if ($DataCache->get($cache_key)) {
    $return_data = $DataCache->get($cache_key);
} else {
    $source = get_url_curl($bp_options['proxyURL'] . "https://namazvakitleri.diyanet.gov.tr/tr-TR/" . $namazCityId . "/s-icin-namaz-vakti");
    preg_match_all('@<caption><h1 class="h4">(.*?) İçin Haftalık Namaz Vakitleri</h1></caption>@si', $source, $sehir_name_c);
    $sehir_isim = $sehir_name_c[1][0];
    preg_match_all('@<div class="tpt-time" id="localTimeField">(.*?)</div>@si', $source, $time);
    preg_match_all('@<div class="ti-miladi">(.*?)</div>@si', $source, $current_date);
    preg_match_all('@<div class="ti-hicri">(.*?)</div>w@si', $source, $second_date);
    preg_match_all('@<div class="tpt-cell" data-vakit-name="(.*?)">                    <div class="tpt-title">(.*?)</div>                    <div class="tpt-time">(.*?)</div>                </div>@si', $source, $times);
    preg_match_all('@</h3><time>(.*?)</time></li>@si', $source, $sub_times);
    preg_match_all('@<table class="table vakit-table">(.*?)</table>@si', $source, $weekly_times_area);
    preg_match_all('@<tr>(.*?)</tr>@si', $weekly_times_area[1][0], $weekly_times_part);
    preg_match_all('@<tr>(.*?)</tr>@si', $weekly_times_area[1][1], $monthly_times_part);
    preg_match_all('@<div id="tab-1" class="tab-content">(.*?)</div>@si', $source, $imsakiye_times_area);
    preg_match_all('@<tr>(.*?)</tr>@si', $weekly_times_area[1][1], $imsakiye_times_part);
    preg_match_all('@<div class="tpt-time">(.*?)</div>@si', $source, $tpt_time);

    $current_time = strtotime(date("H:i"));
    $namaz_time[0] = strtotime($times[3][0]);
    $namaz_time[1] = strtotime($times[3][1]);
    $namaz_time[2] = strtotime($times[3][2]);
    $namaz_time[3] = strtotime($times[3][3]);
    $namaz_time[4] = strtotime($times[3][4]);
    $namaz_time[5] = strtotime($times[3][5]);

    if ($current_time > $namaz_time[0] && $current_time < $namaz_time[1] && $current_time < $namaz_time[2] && $current_time < $namaz_time[3] && $current_time < $namaz_time[4] && $current_time < $namaz_time[1]) {
        $return_data['current_namaz'] = "imsak";
        $return_data['kalan_text'] = "ÖĞLEYE";
        $return_data['kalan_text_header'] = 'İmsak Vakti';
        $return_data['next'] = 2;
    } else if ($current_time < $namaz_time[1] && $current_time > $namaz_time[0]) {
        $return_data['current_namaz'] = "imsak";
        $return_data['kalan_text'] = "ÖĞLEYE";
        $return_data['kalan_text_header'] = 'Öğle Vakti';
        $return_data['next'] = 2;
    } else if ($current_time < $namaz_time[2] && $current_time > $namaz_time[1]) {
        $return_data['kalan_text'] = "ÖĞLEYE";
        $return_data['current_namaz'] = "gunes";
        $return_data['next'] = 2;
        $return_data['kalan_text_header'] = 'Güneş Vakti';
    } else if ($current_time < $namaz_time[3] && $current_time > $namaz_time[2]) {
        $return_data['current_namaz'] = "ogle";
        $return_data['kalan_text'] = "İKİNDİYE";
        $return_data['next'] = 3;
        $return_data['kalan_text_header'] = 'İkindi Vakti';
    } else if ($current_time < $namaz_time[4] && $current_time > $namaz_time[3]) {
        $return_data['current_namaz'] = "ikindi";
        $return_data['kalan_text'] = "AKŞAMA";
        $return_data['next'] = 4;
        $return_data['kalan_text_header'] = 'Akşam Vakti';
    } else if ($current_time < $namaz_time[5] && $current_time > $namaz_time[4]) {
        $return_data['current_namaz'] = "aksam";
        $return_data['kalan_text'] = "YATSIYA";
        $return_data['next'] = 5;
        $return_data['kalan_text_header'] = 'Yatsı Vakti';
    } else {
        $namaz_time[0] = $namaz_time[0] + 86400;
        $return_data['current_namaz'] = "yatsi";
        $return_data['kalan_text'] = "SABAHA";
        $return_data['next'] = 0;
        $return_data['kalan_text_header'] = 'Sabah Vakti';
    }

    $return_data['left_time'] = date_getFullTimeDifference($current_time, $namaz_time[$return_data['next']]);
    $return_data['time'] = date("H:i");
    $return_data['current_date'] = $current_date[1][0];
    $return_data['second_date'] = $second_date[1][0];
    $return_data['current_time'] = date("H:i", $namaz_time[$return_data['next']]);
    $return_data['times'] = $times[3];
    $return_data['sub_times'] = $sub_times[1];
    $return_data['tpt_time'] = $tpt_time[1];
    $return_data['sehir_isim'] = $sehir_isim;
    $return_data['weekly_times_part'] = $weekly_times_part[1];
    $return_data['monthly_times_part'] = $monthly_times_part[1];

    $DataCache->write($cache_key, $return_data);
}

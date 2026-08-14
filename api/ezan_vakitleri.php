<?php
date_default_timezone_set('Europe/Istanbul');
include 'api_helper.php';
global $bp_options;

if(isset($bp_options['kibrisEzan']) && $bp_options['kibrisEzan'] == 1) {
    $ezan = json_decode(get_url_curl("https://ezanvakti.herokuapp.com/vakitler?ilce=15158"), true);
}else{
    if( empty($bp_options['namazCity']) ) $bp_options['namazCity'] = 9541;
    if( isset($bp_options['namazCityLinkSwitch']) && $bp_options['namazCityLinkSwitch'] ) {
        $bp_options['namazCity'] = $bp_options['namazCityLink'];
    }
    $ezan = json_decode(get_url_curl("https://ezanvakti.herokuapp.com/vakitler?ilce=".$bp_options['namazCityLink']), true);
}

$current_ezan = $ezan[0];


$hour = strtotime(date("H:i"));
$ezan_hour['aksam'] = strtotime($current_ezan['Aksam']);
$ezan_hour['imsak'] = strtotime($current_ezan['Imsak']);
$ezan_hour['ikindi'] = strtotime($current_ezan['Ikindi']);
$ezan_hour['ogle'] = strtotime($current_ezan['Ogle']);
$ezan_hour['yatsi'] = strtotime($current_ezan['Yatsi']);

if($ezan_hour['imsak'] > $hour){
    $namaz_time = date("H:i", $ezan_hour['imsak']);
    $namaz_text = "İmsak Vakti";
}else if($ezan_hour['ogle'] > $hour){
    $namaz_time = date("H:i", $ezan_hour['ogle']);
    $namaz_text = "Öğle Vakti";
}else if($ezan_hour['ikindi'] > $hour){
    $namaz_time = date("H:i", $ezan_hour['ikindi']);
    $namaz_text = "İkindi Vakti";
}else if($ezan_hour['aksam'] > $hour){
    $namaz_time = date("H:i", $ezan_hour['aksam']);
    $namaz_text = "Akşam Vakti";
}else if($ezan_hour['yatsi'] > $hour){
    $namaz_time = date("H:i", $ezan_hour['yatsi']);
    $namaz_text = "Yatsı Vakti";
}else{
    $namaz_time = date("H:i", $ezan_hour['imsak']);
    $namaz_text = "İmsak Vakti";
}

$nameList=array(
    1 => 'Adana',
    2 => 'Adıyaman',
    3 => 'Afyonkarahisar',
    4 => 'Ağrı',
    5 => 'Amasya',
    6 => 'Ankara',
    7 => 'Antalya',
    8 => 'Artvin',
    9 => 'Aydın',
    10 => 'Balıkesir',
    11 => 'Bilecik',
    12 => 'Bingöl',
    13 => 'Bitlis',
    14 => 'Bolu',
    15 => 'Burdur',
    16 => 'Bursa',
    17 => 'Çanakkale',
    18 => 'Çankırı',
    19 => 'Çorum',
    20 => 'Denizli',
    21 => 'Diyarbakır',
    22 => 'Edirne',
    23 => 'Elazığ',
    24 => 'Erzincan',
    25 => 'Erzurum',
    26 => 'Eskişehir',
    27 => 'Gaziantep',
    28 => 'Giresun',
    29 => 'Gümüşhane',
    30 => 'Hakkâri',
    31 => 'Hatay',
    32 => 'Isparta',
    33 => 'Mersin',
    34 => 'İstanbul',
    35 => 'İzmir',
    36 => 'Kars',
    37 => 'Kastamonu',
    38 => 'Kayseri',
    39 => 'Kırklareli',
    40 => 'Kırşehir',
    41 => 'Kocaeli',
    42 => 'Konya',
    43 => 'Kütahya',
    44 => 'Malatya',
    45 => 'Manisa',
    46 => 'Kahramanmaraş',
    47 => 'Mardin',
    48 => 'Muğla',
    49 => 'Muş',
    50 => 'Nevşehir',
    51 => 'Niğde',
    52 => 'Ordu',
    53 => 'Rize',
    54 => 'Sakarya',
    55 => 'Samsun',
    56 => 'Siirt',
    57 => 'Sinop',
    58 => 'Sivas',
    59 => 'Tekirdağ',
    60 => 'Tokat',
    61 => 'Trabzon',
    62 => 'Tunceli',
    63 => 'Şanlıurfa',
    64 => 'Uşak',
    65 => 'Van',
    66 => 'Yozgat',
    67 => 'Zonguldak',
    68 => 'Aksaray',
    69 => 'Bayburt',
    70 => 'Karaman',
    71 => 'Kırıkkale',
    72 => 'Batman',
    73 => 'Şırnak',
    74 => 'Bartın',
    75 => 'Ardahan',
    76 => 'Iğdır',
    77 => 'Yalova',
    78 => 'Karabük',
    79 => 'Kilis',
    80 => 'Osmaniye',
    81 => 'Düzce',
    82 => 'Lefkoşa',
);
if($bp_options['havaCity'] == "82") {

    $kaynak = get_url_curl("https://www.hurriyet.com.tr/hava-durumu/lefkosa/");
    preg_match_all('@<p class="weather-detail-hightemp">(.*?)<sup class="degree">@si', $kaynak, $temp);
    preg_match_all('@<p class="weather-detail-condition-text">(.*?)</p>@si', $kaynak, $status);
    preg_match_all('@<i class="wi wi-(.*?)></i>@si', $kaynak, $icon);
    $hava['degree'] = $temp[1][0];
    $hava['status'] = $status[1][0];
    $hava['icon'] = $icon[1][0];
    $hava['name'] = $nameList[$bp_options['havaCity']];
}else{
    $kaynak = json_decode(get_url_curl("https://www.haber7.com/api/widget/weather/".$bp_options['havaCity']), true);

    $icon = permalink($kaynak[0][1]);
    $hava['degree'] = $kaynak[0][0];
    $hava['status'] = $kaynak[0][1];
    $icon_parcala = explode('-', $icon);
    $hava['icon'] = str_replace(array("yagmur", 'kapali','bulutlu', 'gunesli','acik'),array('rain', 'cloudy','cloudy','sunny','sunny'),$icon_parcala[count($icon_parcala)-1]);
    $hava['name'] = $nameList[$bp_options['havaCity']];

}

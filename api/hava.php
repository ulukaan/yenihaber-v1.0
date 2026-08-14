<?php
include 'api_helper.php';
if($_GET['id'] == "83") {
    $kaynak = get_url_curl("https://www.hurriyet.com.tr/hava-durumu/baku/");
    preg_match_all('@<p class="weather-detail-hightemp">(.*?)<sup class="degree">@si', $kaynak, $degree1);
    preg_match_all('@<p class="weather-detail-condition-text">(.*?)</p>@si', $kaynak, $status1);
    preg_match_all('@<i class="wi wi-(.*?)"></i>@si', $kaynak, $icon);

    $icon = $icon[1][0];
    $degree = $degree1[1][0];
    $status = mb_strtoupper($status1[1][0], "UTF-8");

    $icon_parcala = explode('-', $icon);
    $icon_last = str_replace(array("clear"),array('sunny'),$icon_parcala[count($icon_parcala)-1]);

    $hava['name'] = "BAKÜ";
}else if($_GET['id'] == "82") {
    $kaynak = get_url_curl("https://www.hurriyet.com.tr/hava-durumu/lefkosa/");
    preg_match_all('@<p class="weather-detail-hightemp">(.*?)<sup class="degree">@si', $kaynak, $degree1);
    preg_match_all('@<p class="weather-detail-condition-text">(.*?)</p>@si', $kaynak, $status1);
    preg_match_all('@<i class="wi wi-(.*?)"></i>@si', $kaynak, $icon);

    $icon = $icon[1][0];
    $degree = $degree1[1][0];
    $status = mb_strtoupper($status1[1][0], "UTF-8");

    $icon_parcala = explode('-', $icon);
    $icon_last = str_replace(array("clear"),array('sunny'),$icon_parcala[count($icon_parcala)-1]);

    $hava['name'] = "LEFKOŞA";
}else if($_GET['id'] == "84") {
    $kaynak = get_url_curl("https://www.hurriyet.com.tr/hava-durumu/amsterdam/");
    preg_match_all('@<p class="weather-detail-hightemp">(.*?)<sup class="degree">@si', $kaynak, $degree1);
    preg_match_all('@<p class="weather-detail-condition-text">(.*?)</p>@si', $kaynak, $status1);
    preg_match_all('@<i class="wi wi-(.*?)"></i>@si', $kaynak, $icon);

    $icon = $icon[1][0];
    $degree = $degree1[1][0];
    $status = mb_strtoupper($status1[1][0], "UTF-8");

    $icon_parcala = explode('-', $icon);
    $icon_last = $icon_parcala[count($icon_parcala)-1];

    $hava['name'] = "AMSTERDAM";
}else {
    $kaynak = json_decode(get_url_curl("https://www.haber7.com/api/widget/weather/" . $_GET['id']), true);
    $icon = permalink($kaynak[0][1]);
    $degree = $kaynak[0][0];
    $status = $kaynak[0][1];

    $icon_last = $icon;
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
    83 => 'Bakü',
    84 => 'Amsterdam',
);

$icon_last = str_replace(array("12", "13", "15"), array("icon-12", "icon-13", "icon-15"), $icon_last);
if( @$_GET['type'] == "second" ) :
?>
    <span><u><em><?=$nameList[$_GET['id']]?></em> <?=$status?></u> <i class="<?=$icon_last?>"></i> <b><?=$degree?>°</b></span>
<?php else : ?>
    <i class="<?=$icon_last?>"></i>
    <span><?=$nameList[$_GET['id']]?> <b><?=$degree?>°</b></span>
<?php endif; ?>

<?php
include 'api_helper.php';
$fikstur_lig = sahadan_fikstur_lig();
preg_match_all('@<li class="p0c-competition-list__item"> <a href="(.*?)" class="p0c-competition-list__competition-link">  <img class="flag-24x24 p0c-competition-list__national-flag" srcset="(.*?)" src="(.*?)" alt="(.*?)" >  <span class="p0c-competition-list__competition-name"> (.*?) </span> <span class="p0c-competition-list__competition-type"> (.*?) </span> <span class="p0c-competition-list__expander p0c-competition-list__expander--disabled"></span> </a> </li>@si', $fikstur_lig, $fikstur_ligler);

foreach ($fikstur_ligler[1] as $key => $value) {
    if(!strstr($value, "/fikstur/")){
        $new_lig = explode("/",str_replace("https://www.sahadan.com/puan-durumu/", null, $value));
        $new_clean_lig = $new_lig[0]."/fikstur/".$new_lig[1];

        $clean_fikstur_ligler[] = "https://www.sahadan.com/puan-durumu/".$new_clean_lig;
    }else{
        $clean_fikstur_ligler[] = $value;

    }
    $clean_fikstur_ligler_name[] = $fikstur_ligler[5][$key];
}


if(empty($_GET['lig'])){
    $lig_kaynak = sahadan_puan_durumu($clean_fikstur_ligler[0]);
}else{
    $lig_name = "https://www.sahadan.com/".$_GET['lig'];

    $lig_kaynak = sahadan_puan_durumu($clean_fikstur_ligler[$_GET['lig']]);
}

preg_match_all('@"prf.seasonId":"(.*?)"@si', $lig_kaynak, $season_id);
preg_match_all('@<div class="widget-gameweek__arrow widget-gameweek__arrow--prev"></div>(.*?)</ol> </div> </div>  <div class="page-competition-index__nav-container">@si', $lig_kaynak, $lig_week);
preg_match_all('@<li class="widget-gameweek__item(.*?)" data-game-week-index="(.*?)" title="(.*?)" > <span class="widget-gameweek__item-label"> (.*?) </span>  \(<span class="widget-gameweek__date"> (.*?) </span>\)  </li>@si', $lig_week[1][0], $lig_weeks);
preg_match_all('@<h1 class="page-competition-index__headline"> (.*?) </h1>@si', $lig_kaynak, $lig_title);

if(empty($_GET['hafta']))
{
    foreach ($lig_weeks[1] as $key => $value) {
        $key = $key+1;

        if(strstr($value,"widget-gameweek__item--current")){
            $hafta_data = $key;
            $lig_week_kaynak = json_decode(sahadan_puan_durumu("https://www.sahadan.com/perform/p0/ajax/components/competition/match/listing?matchDateFrom=&matchDateTo=&seasonId={$season_id[1][0]}&stageId=&fetchMode=gameweek&gameWeek=$key&ajaxViewName=matches&ajaxPartialViewName=match&sportType=soccer&format=html"), true)['data']['matches']['html'];

        }
    }
}else{

    $lig_week_kaynak = json_decode(sahadan_puan_durumu("https://www.sahadan.com/perform/p0/ajax/components/competition/match/listing?matchDateFrom=&matchDateTo=&seasonId={$season_id[1][0]}&stageId=&fetchMode=gameweek&gameWeek={$_GET['hafta']}&ajaxViewName=matches&ajaxPartialViewName=match&sportType=soccer&format=html"), true)['data']['matches']['html'];
}


preg_match_all('@<li class="p0c-competition-match-list(.*?)" data-day="(.*?)">(.*?)</ol> </li>@si', $lig_week_kaynak, $week_area);

<?php
include 'api_helper.php';
error_reporting(0);

$karsilasma_kaynak = get_url_curl($ad = "https://www.sahadan.com/mac/$perma/karsilastirma/$key");

preg_match_all('@<img class="p0c-soccer-match-details-header__team-crest-image p0c-soccer-match-details-header__team-crest-image--home" src="(.*?)" alt="(.*?)" >@si', $karsilasma_kaynak, $team1_logo);
preg_match_all('@<img class="p0c-soccer-match-details-header__team-crest-image p0c-soccer-match-details-header__team-crest-image--away" src="(.*?)" alt="(.*?)" >@si', $karsilasma_kaynak, $team2_logo);

preg_match_all('@team1Name":"(.*?)"@si', $karsilasma_kaynak, $team1);
preg_match_all('@team2Name":"(.*?)"@si', $karsilasma_kaynak, $team2);
preg_match_all('@data-slot="status-box" >  (.*?)   </div>@si', $karsilasma_kaynak, $match_status);

preg_match_all('@<span class="p0c-soccer-match-details-header__score-home" data-slot="score-home"> (.*?) </span>@si', $karsilasma_kaynak, $score_home);
preg_match_all('@<span class="p0c-soccer-match-details-header__score-away" data-slot="score-away"> (.*?) </span>@si', $karsilasma_kaynak, $score_away);
preg_match_all('@<div class="p0c-soccer-match-details-header__detailed-score" > (.*?) </div>@si', $karsilasma_kaynak, $iy_score);
preg_match_all('@<div class="p0c-soccer-match-details-header__info-container">(.*?)</div> </div>   </div>@si', $karsilasma_kaynak, $info_data);


preg_match_all('@<div class="p0c-match-head-to-head__played-matches--row">(.*?)</div> </div> @si', $karsilasma_kaynak, $son_karsilastirma);
preg_match_all('@data-ga-category="Competition" data-ga-action="CompClick" data-ga-label="Lig" data-jsblank="true" > (.*?) </a>@si', $karsilasma_kaynak, $lig_adi);

foreach ($son_karsilastirma[0] as $key => $value) {
    preg_match_all('@<div class="p0c-match-head-to-head__played-matches--type(.*?)> (.*?) </div>@si', $value, $karsilastirma_type);
    preg_match_all('@style="width:(.*?)" >@si', $value,$karsilastirma_yuzde);
    preg_match_all('@<div class="p0c-match-head-to-head__played-matches--number">(.*?)</div>@si', $value, $karsilastirma_number);

    $karsilastirma_type_array[] = mb_substr($karsilastirma_type[2][0],0,12, "UTF-8");
    $karsilastirma_yuzde_array[] = $karsilastirma_yuzde[1][0];
    $karsilastirma_number_array[] = $karsilastirma_number[1][0];
}

preg_match_all('@<div class="p0c-match-head-to-head__last-games--row">(.*?)</a> </div>  @si', $karsilasma_kaynak, $son_5_mac);

foreach ($son_5_mac[0] as $key => $value) {
    preg_match_all('@<span class="p0c-match-head-to-head__last-games--date"> (.*?) </span>@si', $value, $son_5_date);
    preg_match_all('@<span class="p0c-match-head-to-head__last-games--home-team-name(.*?)"(.*?)> (.*?) </span>@si', $value, $son_5_first);
    preg_match_all('@<span class="p0c-match-head-to-head__last-games--away-team-name(.*?)"(.*?)> (.*?) </span>@si', $value, $son_5_last);
    preg_match_all('@<div class="p0c-match-head-to-head__last-games--score"> (.*?) </div>@si', $value, $son_5_score);
    preg_match_all('@<span class="p0c-match-head-to-head__last-games--competition-code">(.*?)</span>@si', $value, $son_5_status);
    preg_match_all('@<img class="p0c-match-head-to-head__last-games--crest-image" src="(.*?)" alt="(.*?)" >@si', $value, $son_5_image);

    $son_5_date_array[]   = $son_5_date[1][0];
    $son_5_first_array[]  = mb_substr($son_5_first[3][0],0,12, "UTF-8");
    $son_5_last_array[]   = mb_substr($son_5_last[3][0],0,12, "UTF-8");
    $son_5_score_array[]  = $son_5_score[1][0];
    $son_5_status_array[] = $son_5_status[1][0];
    $son_5_image_array[]  = $son_5_image[1][0];
    $son_5_image_array1[]  = $son_5_image[1][1];
}
preg_match_all('@<tr class="p0c-competition-tables__row p0c-competition-tables__row--rank-status p0c-competition-tables__row--rank-status(.*?)" data-team-name="(.*?)" data-team-id="(.*?)" data-team-abbreviation="(.*?)" >(.*?)</tr>@si', $karsilasma_kaynak, $lig_tr);
foreach ($lig_tr[5] as $key => $value) {
    preg_match_all('@<span class="p0c-competition-tables__team-name"> (.*?) </span>@si', $value, $team_name);
    preg_match_all('@<td> (.*?) </td>@si', $value, $team_data);

    $lig_team_name[]  = $team_name[1][0];
    $lig_data_o[]     = $team_data[1][1];
    $lig_data_p[]     = $team_data[1][2];
    $lig_data_a[]     = $team_data[1][3];
    if($lig_tr[1][$key] == "-  p0c-competition-tables__row--highlighted   p0c-competition-tables__row--home   "){
        $lig_data_color[] = "sTeam";
    }else if($lig_tr[1][$key] == "-  p0c-competition-tables__row--highlighted    p0c-competition-tables__row--away  "){
        $lig_data_color[] = "fTeam";
    }else{
        $lig_data_color[] = "";
    }
}

preg_match_all('@"prf.team1Id":"(.*?)"@si', $karsilasma_kaynak, $team1_id);
preg_match_all('@"prf.team2Id":"(.*?)"@si', $karsilasma_kaynak, $team2_id);

preg_match_all('@season="(.*?)"@si', $karsilasma_kaynak, $season_id);

preg_match_all('@<p class="p0c-match-head-to-head__sub-title">(.*?)</p>@si', $karsilasma_kaynak, $son_5_year);

$form_home = json_decode(get_url_curl("https://www.sahadan.com/perform/p0/ajax/components/team/matches?teamId=".$team1_id[1][0]."&competitionId=&startTime=".time()."&matchStatusFilterForLastMatches=Played&matchStatusFilterForNextMatches=Fixture&reversedOrder=false&teamPosition=both&ajaxViewName=team-matches&sportType=soccer&teamPositions="), true)['data']['matches']['html'];
preg_match_all('@<li class="p0c-team-matches__row"(.*?)>(.*?)</li>@si', $form_home, $form_home_tr);

foreach ($form_home_tr[2] as $key => $value) {
    preg_match_all('@data-dateformat="DD/MM/YY"(.*?)> (.*?) </div>@si', $value, $form_home_date);
    preg_match_all('@<a class="p0c-team-matches__team p0c-team-matches__team--home(.*?)" data-jsblank="true"  href="(.*?)"(.*?)> (.*?) </a>@si', $value, $form_home_team1);
    preg_match_all('@<a class="p0c-team-matches__score" href="(.*?)" data-jsblank="true" > (.*?) </a>@si', $value, $form_home_score);
    preg_match_all('@<a class="p0c-team-matches__team p0c-team-matches__team--away(.*?)" data-jsblank="true"  href="(.*?)"(.*?)> (.*?) </a>@si', $value, $form_home_team2);
    preg_match_all('@<div class="p0c-team-matches__match-result p0c-team-matches__match-result--(.*?)" > (.*?) </div>@si', $value, $form_home_result);
    preg_match_all('@<img class="p0c-team-matches__crest" src="(.*?)" alt="(.*?)" >@si', $value, $form_home_image);

    $form_home_date_array[] = $form_home_date[2][0];
    $form_home_team1_array[] = mb_substr($form_home_team1[4][0],0,12,"UTF-8");
    $form_home_score_array[] = $form_home_score[2][0];
    $form_home_team2_array[] = mb_substr($form_home_team2[4][0],0,12,"UTF-8");
    $form_home_result_array[] = $form_home_result[2][0];
    $form_home_image1_array[] = $form_home_image[1][0];
    $form_home_image2_array[] = $form_home_image[1][1];
}

$form_away = json_decode(get_url_curl("https://www.sahadan.com/perform/p0/ajax/components/team/matches?teamId=".$team2_id[1][0]."&competitionId=&startTime=".time()."&matchStatusFilterForLastMatches=Played&matchStatusFilterForNextMatches=Fixture&reversedOrder=false&teamPosition=both&ajaxViewName=team-matches&sportType=soccer&teamPositions="), true)['data']['matches']['html'];
preg_match_all('@<li class="p0c-team-matches__row"(.*?)>(.*?)</li>@si', $form_away, $form_away_tr);

foreach ($form_away_tr[2] as $key => $value) {
    preg_match_all('@data-dateformat="DD/MM/YY"(.*?)> (.*?) </div>@si', $value, $form_away_date);
    preg_match_all('@<a class="p0c-team-matches__team p0c-team-matches__team--home(.*?)" data-jsblank="true"  href="(.*?)"(.*?)> (.*?) </a>@si', $value, $form_away_team1);
    preg_match_all('@<a class="p0c-team-matches__score" href="(.*?)" data-jsblank="true" > (.*?) </a>@si', $value, $form_away_score);
    preg_match_all('@<a class="p0c-team-matches__team p0c-team-matches__team--away(.*?)" data-jsblank="true"  href="(.*?)"(.*?)> (.*?) </a>@si', $value, $form_away_team2);
    preg_match_all('@<div class="p0c-team-matches__match-result p0c-team-matches__match-result--(.*?)" > (.*?) </div>@si', $value, $form_away_result);
    preg_match_all('@<img class="p0c-team-matches__crest" src="(.*?)" alt="(.*?)" >@si', $value, $form_away_image);

    $form_away_date_array[] = $form_away_date[2][0];
    $form_away_team1_array[] = mb_substr($form_away_team1[4][0],0,12,"UTF-8");
    $form_away_score_array[] = $form_away_score[2][0];
    $form_away_team2_array[] = mb_substr($form_away_team2[4][0],0,12,"UTF-8");
    $form_away_result_array[] = $form_away_result[2][0];
    $form_away_image1_array[] = $form_away_image[1][0];
    $form_away_image2_array[] = $form_away_image[1][1];
}


$session_stats1 = json_decode(substr('{"competition'.explode('({"competition',get_sahadan_data($ad = "https://api.performfeeds.com/soccerdata/seasonstats/5p1j175kr2yj1hl8i7s391cty/?_rt=c&tmcl=".$season_id[1][0]."&ctst=".$team1_id[1][0]."&_lcl=tr&_fmt=jsonp&_clbk=W35c581c15eb6f157928b764c146c0852ee8ea35de"))[1],0,-1), true);

$oransal_mac_team1 = 0;
$oransal_gol_team1 = 0;
$oransal_isabetliSut_team1 = 0;
$oransal_isabetliPas_team1 = 0;
$oransal_sutIsabeti_team1 = 0;
$oransal_goleCevirme_team1 = 0;
$oransal_goalAssist_team1 = 0;
$oransal_yedigiGol_team1 = 0;
$oransal_kalesineSut_team1 = 0;
$oransal_topKapma_team1 = 0;
$oransal_ikuluMucadele_team1 = 0;
$oransal_basariliCalim_team1 = 0;
$oransal_basariliPasYuzde_team1 = 0;
$oransal_basariliOrta_team1 = 0;
$oransal_sariKart_team1 = 0;
$oransal_yapilanFaul_team1 = 0;
$oransal_ortaIsabeti_team1 = 0;
$oransal_kirmiziKart_team1 = 0;

$oransal_mac_team2 = 0;
$oransal_gol_team2 = 0;
$oransal_isabetliSut_team2 = 0;
$oransal_isabetliPas_team2 = 0;
$oransal_sutIsabeti_team2 = 0;
$oransal_goleCevirme_team2 = 0;
$oransal_goalAssist_team2 = 0;
$oransal_yedigiGol_team2 = 0;
$oransal_kalesineSut_team2 = 0;
$oransal_topKapma_team2 = 0;
$oransal_ikuluMucadele_team2 = 0;
$oransal_basariliCalim_team2 = 0;
$oransal_basariliPasYuzde_team2 = 0;
$oransal_basariliOrta_team2 = 0;
$oransal_sariKart_team2 = 0;
$oransal_yapilanFaul_team2 = 0;
$oransal_ortaIsabeti_team2 = 0;
$oransal_kirmiziKart_team2 = 0;

foreach ($session_stats1['contestant']['stat'] as $key => $value) {

    if($value['name'] == "Games Played")
    {
        $oransal_mac_team1 = $value['value'];
    }

    if($value['name'] == "Goals")
    {
        $oransal_gol_team1 = $value['value'];
    }

    if($value['name'] == "Shots On Target ( inc goals )")
    {
        $oransal_isabetliSut_team1 = $value['value'];
    }

    if($value['name'] == "Shooting Accuracy")
    {
        $oransal_sutIsabeti_team1 = $value['value'];
    }

    if($value['name'] == "Goal Conversion")
    {
        $oransal_goleCevirme_team1 = $value['value'];
    }

    if($value['name'] == "Goal Assists")
    {
        $oransal_goalAssist_team1 = $value['value'];
    }

    if($value['name'] == "Goals Conceded")
    {
        $oransal_yedigiGol_team1 = $value['value'];
    }

    if($value['name'] == "GK Unsuccessful Distribution")
    {
        $oransal_kalesineSut_team1 = $value['value'];
    }

    if($value['name'] == "Tackles Won")
    {
        $oransal_topKapma_team1 = $value['value'];
    }

    if($value['name'] == "Tackle Success")
    {
        $oransal_topKapmaYuzde_team1 = $value['value'];
    }

    if($value['name'] == "Duels won")
    {
        $oransal_ikuluMucadele_team1 = $value['value'];
    }

    if($value['name'] == "Total Successful Passes ( Excl Crosses & Corners ) ")
    {
        $oransal_basariliPas_team1 = $value['value'];
    }

    if($value['name'] == "Passing Accuracy")
    {
        $oransal_basariliPasYuzde_team1 = $value['value'];
    }

    if($value['name'] == "Successful Launches")
    {
        $oransal_basariliOrta_team1 = $value['value'];
    }

    if($value['name'] == "Crossing Accuracy")
    {
        $oransal_ortaIsabeti_team1 = $value['value'];
    }

    if($value['name'] == "Successful Dribbles")
    {
        $oransal_basariliCalim_team1 = $value['value'];
    }


    if($value['name'] == "Total Fouls Won")
    {
        $oransal_yapilanFaul_team1 = $value['value'];
    }

    if($value['name'] == "Total Fouls Conceded")
    {
        $oransal_faul_team1 = $value['value'];
    }

    if($value['name'] == "Yellow Cards")
    {
        $oransal_sariKart_team1 = $value['value'];
    }

    if($value['name'] == "Total Red Cards")
    {
        $oransal_kirmiziKart_team1 = $value['value'];
    }

}



$session_stats2 = json_decode(substr('{"competition'.explode('({"competition',get_sahadan_data("https://api.performfeeds.com/soccerdata/seasonstats/5p1j175kr2yj1hl8i7s391cty/?_rt=c&tmcl=".$season_id[1][0]."&ctst=".$team2_id[1][0]."&_lcl=tr&_fmt=jsonp&_clbk=W3d32c5d68bc6bb1b8f859c71f9ad6647fe1a2c3bd"))[1],0,-1), true);
foreach ($session_stats2['contestant']['stat'] as $key => $value) {
    if($value['name'] == "Games Played")
    {
        $oransal_mac_team2 = $value['value'];
    }

    if($value['name'] == "Goals")
    {
        $oransal_gol_team2 = $value['value'];
    }

    if($value['name'] == "Shots On Target ( inc goals )")
    {
        $oransal_isabetliSut_team2 = $value['value'];
    }

    if($value['name'] == "Shooting Accuracy")
    {
        $oransal_sutIsabeti_team2 = $value['value'];
    }

    if($value['name'] == "Goal Conversion")
    {
        $oransal_goleCevirme_team2 = $value['value'];
    }

    if($value['name'] == "Goal Assists")
    {
        $oransal_goalAssist_team2 = $value['value'];
    }

    if($value['name'] == "Goals Conceded")
    {
        $oransal_yedigiGol_team2 = $value['value'];
    }

    if($value['name'] == "GK Unsuccessful Distribution")
    {
        $oransal_kalesineSut_team2 = $value['value'];
    }

    if($value['name'] == "Tackles Won")
    {
        $oransal_topKapma_team2 = $value['value'];
    }

    if($value['name'] == "Tackle Success")
    {
        $oransal_topKapmaYuzde_team2 = $value['value'];
    }

    if($value['name'] == "Duels won")
    {
        $oransal_ikuluMucadele_team2 = $value['value'];
    }

    if($value['name'] == "Total Successful Passes ( Excl Crosses & Corners ) ")
    {
        $oransal_basariliPas_team2 = $value['value'];
    }

    if($value['name'] == "Passing Accuracy")
    {
        $oransal_basariliPasYuzde_team2 = $value['value'];
    }

    if($value['name'] == "Successful Launches")
    {
        $oransal_basariliOrta_team2 = $value['value'];
    }

    if($value['name'] == "Crossing Accuracy")
    {
        $oransal_ortaIsabeti_team2 = $value['value'];
    }

    if($value['name'] == "Successful Dribbles")
    {
        $oransal_basariliCalim_team2 = $value['value'];
    }


    if($value['name'] == "Total Fouls Won")
    {
        $oransal_yapilanFaul_team2 = $value['value'];
    }

    if($value['name'] == "Total Fouls Conceded")
    {
        $oransal_faul_team2 = $value['value'];
    }

    if($value['name'] == "Yellow Cards")
    {
        $oransal_sariKart_team2 = $value['value'];
    }

    if($value['name'] == "Total Red Cards")
    {
        $oransal_kirmiziKart_team2 = $value['value'];
    }

}


$soccer_data = json_decode('{"matchInfo'.substr(explode('({"matchInfo',get_sahadan_data("https://api.performfeeds.com/soccerdata/matchstats/5p1j175kr2yj1hl8i7s391cty/".$_GET['key']."?_rt=c&detailed=yes&_lcl=tr&_fmt=jsonp&_clbk=W3d32c5d68bc6bb1b8f859c71f9ad6647fe1a2c3bd"))[1],0,-1), true);

$team1_stat = $soccer_data['liveData']['lineUp'][0]['stat'];
$team2_stat = $soccer_data['liveData']['lineUp'][1]['stat'];

foreach (@$team1_stat as $key => $value) {
    if($value['type'] == "possessionPercentage"){
        $istatistik_toplaOynama_team1 = $value['value'];
    }

    if($value['type'] == "duelWon"){
        $istatistik_ikiliMucadele_team1 = $value['value'];
    }

    if($value['type'] == "totalLaunches"){
        $istatistik_pasArasi_team1 = $value['value'];

    }

    if($value['type'] == "totalOffside")
    {
        $istatistik_ofsayt_team1 = $value['value'];

    }

    if($value['type'] == "wonCorners")
    {
        $istatistik_korner_team1 = $value['value'];

    }

    if($value['type'] == "totalYellowCard")
    {
        $istatistik_sariKart_team1 = $value['value'];

    }

    if($value['type'] == "totalRedCard")
    {
        $istatistik_kirmiziKart_team1 = $value['value'];

    }

    if($value['type'] == "fkFoulLost")
    {
        $istatistik_faul_team1 = $value['value'];

    }

    if($value['type'] == "totalTackle")
    {
        $istatistik_topKapma_team1 = $value['value'];

    }

    if($value['type'] == "totalClearance")
    {
        $istatistik_uzaklastirma_team1 = $value['value'];

    }

    if($value['type'] == "goals")
    {
        $istatistik_gol_team1 = $value['value'];

    }

    if($value['type'] == "totalScoringAtt")
    {
        $istatistik_sut_team1 = $value['value'];

    }

    if($value['type'] == "blockedScoringAtt")
    {
        $istatistik_engellenenSut_team1 = $value['value'];

    }

    if($value['type'] == "totalPass")
    {
        $istatistik_pas_team1 = $value['value'];
    }

    if($value['type'] == "totalLongBalls")
    {
        $istatistik_uzunPas_team1 = $value['value'];
    }

    if($value['type'] == "totalCross")
    {
        $istatistik_orta_team1 = $value['value'];
    }

    if($value['type'] == "ontargetScoringAtt")
    {
        $istatistik_isabetliSut_team1 = $value['value'];
    }

    if($value['type'] == "attemptsIbox")
    {
        $istatistik_cezaSahasiIcinden_team1 = $value['value'];
    }

    if($value['type'] == "attemptsObox")
    {
        $istatistik_cezaSahasiDisindan_team1 = $value['value'];
    }


}
if(empty($istatistik_ikiliMucadele_team1))
{

    $istatistik_ikiliMucadele_team1 = 0;
}
if(empty($istatistik_pasArasi_team1))
{
    $istatistik_pasArasi_team1 = 0;
}
if(empty($istatistik_ofsayt_team1))
{
    $istatistik_ofsayt_team1 = 0;
}
if(empty($istatistik_korner_team1))
{
    $istatistik_korner_team1 = 0;
}
if(empty($istatistik_sariKart_team1))
{
    $istatistik_sariKart_team1 = 0;
}
if(empty($istatistik_faul_team1))
{
    $istatistik_faul_team1 = 0;
}
if(empty($istatistik_topKapma_team1))
{
    $istatistik_topKapma_team1 = 0;
}
if(empty($istatistik_uzaklastirma_team1))
{
    $istatistik_uzaklastirma_team1 = 0;
}
if(empty($istatistik_gol_team1))
{
    $istatistik_gol_team1 = 0;
}
if(empty($istatistik_sut_team1))
{
    $istatistik_sut_team1 = 0;
}
if(empty($istatistik_engellenenSut_team1))
{
    $istatistik_engellenenSut_team1 = 0;
}
foreach (@$team2_stat as $key => $value) {
    if($value['type'] == "possessionPercentage"){
        $istatistik_toplaOynama_team2 = $value['value'];

    }

    if($value['type'] == "duelWon"){
        $istatistik_ikiliMucadele_team2 = $value['value'];

    }

    if($value['type'] == "totalLaunches"){
        $istatistik_pasArasi_team2 = $value['value'];

    }

    if($value['type'] == "totalOffside")
    {
        $istatistik_ofsayt_team2 = $value['value'];

    }

    if($value['type'] == "wonCorners")
    {
        $istatistik_korner_team2 = $value['value'];

    }

    if($value['type'] == "totalYellowCard")
    {
        $istatistik_sariKart_team2 = $value['value'];

    }

    if($value['type'] == "totalRedCard")
    {
        $istatistik_kirmiziKart_team2 = $value['value'];

    }

    if($value['type'] == "fkFoulLost")
    {
        $istatistik_faul_team2 = $value['value'];

    }

    if($value['type'] == "totalTackle")
    {
        $istatistik_topKapma_team2 = $value['value'];

    }

    if($value['type'] == "totalClearance")
    {
        $istatistik_uzaklastirma_team2 = $value['value'];

    }

    if($value['type'] == "goals")
    {
        $istatistik_gol_team2 = $value['value'];

    }

    if($value['type'] == "totalScoringAtt")
    {
        $istatistik_sut_team2 = $value['value'];

    }

    if($value['type'] == "blockedScoringAtt")
    {
        $istatistik_engellenenSut_team2 = $value['value'];

    }

    if($value['type'] == "totalPass")
    {
        $istatistik_pas_team2 = $value['value'];
    }

    if($value['type'] == "totalLongBalls")
    {
        $istatistik_uzunPas_team2 = $value['value'];
    }

    if($value['type'] == "totalCross")
    {
        $istatistik_orta_team2 = $value['value'];
    }

    if($value['type'] == "ontargetScoringAtt")
    {
        $istatistik_isabetliSut_team2 = $value['value'];
    }

    if($value['type'] == "attemptsIbox")
    {
        $istatistik_cezaSahasiIcinden_team2 = $value['value'];
    }

    if($value['type'] == "attemptsObox")
    {
        $istatistik_cezaSahasiDisindan_team2 = $value['value'];
    }



}
if(empty($istatistik_toplaOynama_team2))
{
    $istatistik_toplaOynama_team2 = 0;
}
if(empty($istatistik_ikiliMucadele_team2))
{
    $istatistik_ikiliMucadele_team2 = 0;
}
if(empty($istatistik_pasArasi_team2))
{
    $istatistik_pasArasi_team2 = 0;
}
if(empty($istatistik_ofsayt_team2))
{
    $istatistik_ofsayt_team2 = 0;
}
if(empty($istatistik_korner_team2))
{
    $istatistik_korner_team2 = 0;
}
if(empty($istatistik_sariKart_team2))
{
    $istatistik_sariKart_team2 = 0;
}
if(empty($istatistik_faul_team2))
{
    $istatistik_faul_team2 = 0;
}

if(empty($istatistik_topKapma_team2))
{
    $istatistik_topKapma_team2 = 0;
}

if(empty($istatistik_toplaOynama_team1))
{

    $istatistik_toplaOynama_team1 = "0";
}

if(empty($istatistik_engellenenSut_team2))
{
    $istatistik_engellenenSut_team2 = 0;
}

if(empty($istatistik_sut_team2))
{
    $istatistik_sut_team2 = 0;
}

if(empty($istatistik_gol_team2))
{
    $istatistik_gol_team2 = 0;
}

if(empty($istatistik_uzaklastirma_team2))
{
    $istatistik_uzaklastirma_team2 = 0;
}

if(empty($istatistik_kirmiziKart_team1))
{
    $istatistik_uzaklastirma_team1 = 0;
}
if(empty($istatistik_kirmiziKart_team2))
{
    $istatistik_uzaklastirma_team2 = 0;
}

$mac_tahmini_kaynak = get_url_curl("https://login.mackolik.com/socialize.getReactionsCount?barID=".$_GET['key']."&buttonIDs=home%2C%20draw%2C%20away&APIKey=3_JJ5-Jx4BbdCCvJYt7cm73c3O0HfPuRal0GWmLzcGFJKK1H3zYKyJihvXPLwuCwaL&sdk=js_latest&authMode=cookie&pageURL=&format=jsonp&callback=gigya.callback&context=R3822727467");
preg_match_all('@"home",      "count": (.*?)    @si', $mac_tahmini_kaynak, $vote_home_count);
preg_match_all('@"draw",      "count": (.*?)    @si', $mac_tahmini_kaynak, $vote_draw_count);
preg_match_all('@"away",      "count": (.*?)    @si', $mac_tahmini_kaynak, $vote_away_count);
$totalVoteCount = $vote_home_count[1][0]+$vote_draw_count[1][0]+$vote_away_count[1][0];
if(isset($vote_home_count[1][0])) {
    @$homeVotePercentage = @ceil(100 * ($vote_home_count[1][0] / $totalVoteCount));
    @$awayVotePercentage = @ceil(100 * ($vote_away_count[1][0] / $totalVoteCount));
    @$drawVotePercentage = @ceil(100 * ($vote_draw_count[1][0] / $totalVoteCount));
}

$search_tr_code = array('\u011f',
'\u011e',
'\u0131',
'\u0130',
'\u00f6',
'\u00d6',
'\u00fc',
'\u00dc',
'\u015f',
'\u015e',
'\u00e7','\u00c7');

$find_tr_code = array(
    'ğ','Ğ','ı','İ','ö','Ö','ü','Ü','ş','Ş','ç','Ç'
);

$team1[1][0] = str_replace( $search_tr_code, $find_tr_code, $team1[1][0] );
$team2[1][0] = str_replace( $search_tr_code, $find_tr_code, $team2[1][0] );
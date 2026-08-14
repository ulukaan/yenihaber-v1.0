<?php
include 'api_helper.php';
error_reporting(0);
if(!function_exists("month_eng_to_tr")){
    function month_eng_to_tr($str)
    {
        $ing_aylar = array("January","February","March","May","April","June","July","August","September","October","November","December");
        $tr_aylar = array("Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık");

        return str_replace($ing_aylar, $tr_aylar, $str);
    }
}

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

        if(trim($value) == "widget-gameweek__item--current"){
            $hafta_data = $key;
            $lig_week_kaynak = json_decode(sahadan_puan_durumu("https://www.sahadan.com/perform/p0/ajax/components/competition/match/listing?matchDateFrom=&matchDateTo=&seasonId={$season_id[1][0]}&stageId=&fetchMode=gameweek&gameWeek=$key&ajaxViewName=matches&ajaxPartialViewName=match&sportType=soccer&format=html"), true)['data']['matches']['html'];

        }
    }
}else{

    $lig_week_kaynak = json_decode(sahadan_puan_durumu("https://www.sahadan.com/perform/p0/ajax/components/competition/match/listing?matchDateFrom=&matchDateTo=&seasonId={$season_id[1][0]}&stageId=&fetchMode=gameweek&gameWeek={$_GET['hafta']}&ajaxViewName=matches&ajaxPartialViewName=match&sportType=soccer&format=html"), true)['data']['matches']['html'];
}
if(!empty($_GET['hafta'])){
    $hafta_data = $_GET['hafta'];
}

preg_match_all('@<li class="p0c-competition-match-list(.*?)" data-day="(.*?)">(.*?)</ol> </li>@si', $lig_week_kaynak, $week_area);

switch ($_GET['lig']) {
    case '0':
        $icon_name = "flagTr";
        break;

    case '3': $icon_name = "laLiga"; break;
    case '1': $icon_name = "premierLig"; break;
    case '2': $icon_name = "bundesliga"; break;
    case '4': $icon_name = "serieA"; break;

    default:
        // code...
        break;
}
?>
<div class="h">
    <img src="/wp-content/themes/birhaber/img/media/<?=$icon_name?>.png" alt="<?=$icon_name?>">
    <strong><?=$lig_title[1][0]?></strong>
    <div>
        <i class="icon-down-arrow-forward"></i>
        <select onchange="getLig(<?=$_GET['lig']?>, this.value); this.selectedindex = -1">
            <?php for($i = 1; $i < 35; $i++): ?>
                <option <?php if($hafta_data == $i): echo 'selected '; endif;?>value="<?=$i?>"><?=$i?>.HAFTA</option>
            <?php endfor; ?>
        </select>
    </div>
</div>
<div class="t">
    <table>
        <?php
        foreach($week_area[3] as $key=>$value):
            preg_match_all('@<span class="p0c-competition-match-list__team-full"> (.*?) </span> <abbr class="p0c-competition-match-list__team-code" title="(.*?)" >@si', $value, $home_team);
            preg_match_all('@data-jsblank="true"  href="https://www.sahadan.com/takim/(.*?)/ma%C3%A7lar/(.*?)"  >@si', $value, $home_id);
            preg_match_all('@team--away">   <a href="https://www.sahadan.com/takim/(.*?)/ma%C3%A7lar/(.*?)"@si', $value, $away_id);


            preg_match_all('@<span class="p0c-competition-match-list__score" data-slot="score-home"> (.*?) </span>@si', $value, $home_score);

            preg_match_all('@<span class="p0c-competition-match-list__score" data-slot="score-away"> (.*?) </span>@si', $value, $away_score);
            preg_match_all('@data-slot="status-box" data-jsblank="true" >  (.*?)  </a>@si', $value, $status_box);
            preg_match_all('@<img class="p0c-competition-match-list__team-crest" src="(.*?)" alt="(.*?)" >@si', $value, $team_image);
            preg_match_all('@<span data-utc="(.*?)" data-dateformat="time" data-slot="start-hour"> (.*?) </span>@si', $value, $hour_timestamp);
            preg_match_all('@<div class="p0c-competition-match-list__match-content"> <a  href="(.*?)" data-alt-href="@si', $value, $team_perma);

            foreach($home_team[1] as $key2=>$value_match):

                if($key2 == 0){
                    $home_plus = 0;
                    $away_plus = 1;
                }else{
                    $home_plus = $key2*2;
                    $away_plus = $home_plus+1;
                }

                if(empty($home_team[1][$home_plus])){
                    continue;
                }

                $perma_mac = explode("/",explode("mac/",$team_perma[1][$key2])[1]);

                if(empty($hour_timestamp[2][0])){
                    $hour_timestamp[2][0] = "MS";
                }else{

                }

                if( $hour_timestamp[2][0] != "MS" ) {
                    $hour_timestamp[2][0] = date("H:i",( strtotime( $hour_timestamp[2][0] ) + ( 3600 * 3 ) ) );
                }



                ?>
                <tr>
                    <td><?=month_eng_to_tr(date("d F", strtotime($week_area[2][$key])))?></td>

                    <td style="text-align: right;"><?=$home_team[1][$home_plus]?></td>
                    <td class="center">
                        <ul>
                            <li>

                                <img src="https://secure.cache.images.core.optasports.com/soccer/teams/30x30/uuid_<?=$home_id[2][$home_plus]?>.png?v=1.48.0&gis=mk" width="14" height="20" alt="<?=$home_team[1][$home_plus]?>">

                            </li>
                            <li><span><?=$home_score[1][$key2]?></span></li>
                            <li><time datetime="2008-02-14 17:00"><?=$hour_timestamp[2][0]?></time></li>
                            <li><span><?=$away_score[1][$key2]?></span></li>
                            <li>

                                <img src="https://secure.cache.images.core.optasports.com/soccer/teams/30x30/uuid_<?=$home_id[2][$away_plus]?>.png?v=1.48.0&gis=mk" width="14" height="20" alt="<?=$home_team[1][$away_plus]?>">

                            </li>

                        </ul>
                    </td>
                    <td><?=$home_team[1][$away_plus]?></td>

                    <td style="text-align: right;"><a href="/mac-detay?mac=<?=$perma_mac[0]?>&key=<?=$perma_mac[1]?>" class="icon-line-chart"></a></td>
                </tr>

            <?php endforeach; endforeach; ?>

    </table>
</div>
<div class="mobile">
    <div class="swiper-container">
        <div class="swiper-wrapper">
            <?php
            foreach($week_area[3] as $key=>$value):
                preg_match_all('@<span class="p0c-competition-match-list__team-full"> (.*?) </span> <abbr class="p0c-competition-match-list__team-code" title="(.*?)" >@si', $value, $home_team);
                preg_match_all('@data-jsblank="true"  href="https://www.sahadan.com/takim/(.*?)/ma%C3%A7lar/(.*?)"  >@si', $value, $home_id);
                preg_match_all('@team--away">   <a href="https://www.sahadan.com/takim/(.*?)/ma%C3%A7lar/(.*?)"@si', $value, $away_id);


                preg_match_all('@<span class="p0c-competition-match-list__score" data-slot="score-home"> (.*?) </span>@si', $value, $home_score);

                preg_match_all('@<span class="p0c-competition-match-list__score" data-slot="score-away"> (.*?) </span>@si', $value, $away_score);
                preg_match_all('@data-slot="status-box" data-jsblank="true" >  (.*?)  </a>@si', $value, $status_box);
                preg_match_all('@<img class="p0c-competition-match-list__team-crest" src="(.*?)" alt="(.*?)" >@si', $value, $team_image);
                preg_match_all('@<span data-utc="(.*?)" data-dateformat="time" data-slot="start-hour"> (.*?) </span>@si', $value, $hour_timestamp);
                preg_match_all('@<div class="p0c-competition-match-list__match-content"> <a  href="(.*?)" data-alt-href="@si', $value, $team_perma);

                foreach($home_team[1] as $key2=>$value_match):

                    if($key2 == 0){
                        $home_plus = 0;
                        $away_plus = 1;
                    }else{
                        $home_plus = $key2*2;
                        $away_plus = $home_plus+1;
                    }

                    if(empty($home_team[1][$home_plus])){
                        continue;
                    }

                    if( $hour_timestamp[2][$key] != "MS" ) {
                        $hour_timestamp[2][$key] = date("H:i",( strtotime( $hour_timestamp[2][$key] ) + ( 3600 * 3 ) ) );
                    }

                    ?>
                    <div class="swiper-slide">
                        <div class="team">

                            <img src="https://secure.cache.images.core.optasports.com/soccer/teams/30x30/uuid_<?=$home_id[2][$home_plus]?>.png?v=1.48.0&gis=mk" width="30px" height="30px" alt="<?=$home_team[1][$home_plus]?>">

                            <strong><?=$home_team[1][$home_plus]?></strong>

                        </div>
                        <div class="center">
                            <?php if(!empty($home_score[1][$key2]) && !empty($away_score[1][$key2])):?>
                                <p class="score">
                                    <span><?=$home_score[1][$key2]?></span><b>:</b><span><?=$away_score[1][$key2]?></span>
                                </p>
                            <?php endif; ?>
                            <p class="time">
                                <?=month_eng_to_tr(date("d F", strtotime($week_area[2][$key])))?>
                                <strong><?=$hour_timestamp[2][$key]?></strong>
                            </p>
                        </div>
                        <div class="team">
                            <img src="https://secure.cache.images.core.optasports.com/soccer/teams/30x30/uuid_<?=$home_id[2][$away_plus]?>.png?v=1.48.0&gis=mk" width="30px" height="30px" alt="<?=$home_team[1][$home_plus]?>">
                            <strong><?=$home_team[1][$away_plus]?></strong>

                        </div>
                    </div>
                <?php endforeach; endforeach; ?>
        </div>
    </div>
    <div class="navDot"></div>
</div>
</div>

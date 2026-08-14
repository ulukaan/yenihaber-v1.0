<?php
include 'api_helper.php';
$position = $_GET['position'];
$teamId = $_GET['teamId'];
$form_home = json_decode(get_url_curl("https://www.sahadan.com/perform/p0/ajax/components/team/matches?teamId=".$teamId."&competitionId=&startTime=".time()."&matchStatusFilterForLastMatches=Played&matchStatusFilterForNextMatches=Fixture&reversedOrder=false&teamPosition=$position&ajaxViewName=team-matches&sportType=soccer&teamPositions="), true)['data']['matches']['html'];
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

foreach($form_home_date_array as $key=>$value): ?>
    <div class="item">
        <span class="date"><?=$value?></span>
        <ul>
            <li><p><?=$form_home_team1_array[$key]?></p> <i><img src="<?=$form_home_image1_array[$key]?>" style="width: 20px" alt="<?=$form_home_team1[$key]?>" /></i></li>
            <li><span><?=$form_home_score_array[$key]?></span></li>
            <li><i><img src="<?=$form_home_image2_array[$key]?>" style="width: 20px" alt="<?=$form_home_team2[$key]?>" /></i> <p><?=$form_home_team2_array[$key]?></p></li>
        </ul>
        <span class="result <?=strtolower($form_home_result_array[$key])?>"><i><?=$form_home_result_array[$key]?></i></span>
    </div>
<?php endforeach; ?>

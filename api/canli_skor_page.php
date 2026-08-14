<?php
include 'api_helper.php';
date_default_timezone_set('Europe/Istanbul');
$match_list1 = sahadan("all", date("Y-m-d"));
$yesterday = date('Y-m-d',strtotime(date("Y-m-d") . "-1 days"));
$match_list2 = sahadan("all", $yesterday);

foreach ($match_list1['data']['matches'] as $key => $value) {
    if($value['substate'] != "suspended"){
        $live_match[$value['competitionId']][] = $value;

        foreach($match_list1['data']['competitions'] as $key_comp => $comp_value):
            if($key_comp == $value['competitionId']){
                $live_match_league[$value['competitionId']]['name'] = $comp_value['name'];
                $live_match_league[$value['competitionId']]['country'] = $comp_value['country']['id'];
            }
        endforeach;
    }
}

foreach ($match_list2['data']['matches'] as $key => $value) {
    if($value['state'] == "live" && $value['substate'] != "suspended"){
        $live_match[$value['competitionId']][] = $value;

        foreach($match_list2['data']['competitions'] as $key_comp => $comp_value):
            if($key_comp == $value['competitionId']){
                $live_match_league[$value['competitionId']]['name'] = $comp_value['name'];
                $live_match_league[$value['competitionId']]['country'] = $comp_value['country']['id'];
            }
        endforeach;
    }
}

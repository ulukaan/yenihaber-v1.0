<?php
include 'api_helper.php';
$match_list1 = sahadan("football", date("Y-m-d"));
$yesterday = date('Y-m-d',strtotime(date("Y-m-d") . "-1 days"));
$match_list2 = sahadan("football", $yesterday);

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

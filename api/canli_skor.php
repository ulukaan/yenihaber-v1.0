<?php
include 'api_helper.php';
global $total_match;
$matchList = json_decode(ntv_spor(), true);

if(isset($matchList['initialData']) && count($matchList['initialData'])){
    foreach ($matchList['initialData'] as $key => $value) {
        foreach ($value['matches'] as $key2 => $value2) {
            $hour = explode(" ",$value2['date'])[1];
            $total_match['homeTeam']['name'][]  = @$value2['homeTeam']['shortName'];
            $total_match['awayTeam']['name'][]  = @$value2['awayTeam']['shortName'];
            $total_match['status'][]            = @$value2['status']['shortName'];
            $total_match['start_hour'][]        = @explode(":",$hour)[0].":".explode(":",$hour)[1];
            $total_match['homeTeam']['id'][]    = @$value2['homeTeam']['id'];
            $total_match['awayTeam']['id'][]    = @$value2['awayTeam']['id'];
            $total_match['homeTeam']['score'][] = @$value2['homeTeam']['score']['current'];
            $total_match['awayTeam']['score'][] = @$value2['awayTeam']['score']['current'];

        }
    }
}

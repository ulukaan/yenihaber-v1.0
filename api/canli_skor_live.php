<?php
include 'api_helper.php';
$match_list1 = sahadan_update("all", date("Y-m-d"))['data'];
$tomorrow = date('Y-m-d',strtotime($date1 . "+1 days"));
$match_list2 = sahadan_update("all", $tomorrow)['data'];
$match_list = array_merge($match_list1, $match_list2);
$type = $_GET['type'];
$i = 0;
foreach ($match_list1 as $key => $value) {
    switch ($type) {
        case 'live':
            if($value['state'] == "live"){


                $baslangicSaati = date("H:i",($value['mstUtc'])/1000);
                $periodStatus =  intval((($value['lastUpdated']/1000)-($value['mstUtc']/1000))/60);
                $minutes =  intval((time()-($value['periodStart']/1000))/60);


                if($value['periodId'] == 2){
                    $minutes = $minutes+45;
                }

                $minutes = $minutes+1;

                if($value['periodId'] == 10){
                    $minutes = 'IY';
                }

                if($minutes > 90){
                    $minutes_left = $minutes-90;
                    $minutes = "90+".$minutes_left;
                }

                if(empty($value['periodStart'])){
                    $minutes = $value['statusBoxContent'];
                }

                $live_match[$i] = $value;
                $live_match[$i]['id'] = $key;
                $live_match[$i]['minutes'] = $minutes;
                $i = $i+1;
            }
            break;
    }

}

echo json_encode($live_match);

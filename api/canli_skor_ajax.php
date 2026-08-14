<?php
include 'api_helper.php';
error_reporting(0);
$match_list1 = sahadan($_GET['list'], date("Y-m-d")); // BASKETBOL EKLENINCE FOOTBALLI DUZELT
$yesterday = date('Y-m-d',strtotime(date("Y-m-d") . "-1 days"));
$match_list2 = array();
switch($_GET['type']):

    case 'lig':
        foreach ($match_list1['data']['matches'] as $key => $value) {
            if($value['state'] == "live" && $value['substate'] != "suspended"){
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

        if(empty($live_match_league)){echo '<center><p style="color: #fff;margin-top: 10px;">Canlı maç bulunmamaktadır.</p></center>';}
        foreach($live_match_league as $key2=>$live):  ?>
            <div class="leagueHead ingiltere"><i style="background: url('https://www.sahadan.com/img/flag-<?=$live_match_league[$key2]['country']?>-36x36.png')no-repeat center top #000000;"></i><span><?=$live['name']?></span></div>
            <?php foreach (($live_match[$key2]) as $key3 => $value2) {

                $baslangicSaati = date("H:i",($value2['mstUtc'])/1000);
                $periodStatus =  intval((($value2['lastUpdated']/1000)-($value2['mstUtc']/1000))/60);
                $minutes =  intval((time()-($value2['periodStart']/1000))/60);


                if($value2['periodId'] == 2){
                    $minutes = $minutes+45;
                }

                $minutes = $minutes+1;
                if($value2['periodId'] == 10){
                    $minutes = 'IY';
                }


                if($minutes > 90){
                    $minutes_left = $minutes-90;
                    $minutes = "90+".$minutes_left;
                }

                if(empty($value2['periodStart'])){
                    $minutes = $value2['statusBoxContent'];
                }



                ?>
                <div class="matchAllAjax<?=$value2['id']?> matchAjaxBar">
                    <input type="hidden" class="teamAjaxId" value="<?=$value2['id']?>" />
                    <input type="hidden" class="redCardHomeAjax<?=$value2['id']?>" value="<?=$value2['redCards']['home']?>" />
                    <input type="hidden" class="redCardAwayAjax<?=$value2['id']?>" value="<?=$value2['redCards']['away']?>" />
                    <div class="thisMatch matchAjax<?=$value2['id']?>">
                        <div class="rateBar">
                            <span class="time timeAjax<?=$value2['id']?>"><?=$baslangicSaati?></span>

                            <span class="live"><i>CANLI</i><b class="minuteAjax<?=$value2['id']?>"><?=$minutes?>’</b></span>
                            <ul class="teamLogos">
                                <li class="left homeLogo<?=$value2['id']?>"><img src="https://secure.cache.images.core.optasports.com/soccer/teams/30x30/uuid_<?=$value2['homeTeam']['id']?>.png" alt="<?=$value2['homeTeam']['name']?>" /></li>
                                <li class="right awayLogo<?=$value2['id']?>"><img src="https://secure.cache.images.core.optasports.com/soccer/teams/30x30/uuid_<?=$value2['awayTeam']['id']?>.png" alt="<?=$value2['awayTeam']['name']?>" /></li>
                            </ul>
                            <ul class="scores">
                                <a href="/mac-detay/?mac=<?=($value2['homeTeam']['slug']."-vs-".$value2['awayTeam']['slug'])?>&key=<?=$value2['id']?>"><li <?php if($value2['score']['home'] > $value2['score']['away']) echo 'class="winner"';?>><span class="homeName<?=$value2['id']?>"><?=$value2['homeTeam']['name']?></span><i class="homeScoreAjax<?=$value2['id']?>"><?=$value2['score']['home']?></i></li></a>
                                <a href="/mac-detay/?mac=<?=($value2['homeTeam']['slug']."-vs-".$value2['awayTeam']['slug'])?>&key=<?=$value2['id']?>"><li <?php if($value2['score']['home'] < $value2['score']['away']) echo 'class="winner"';?>><span class="awayName<?=$value2['id']?>"><?=$value2['awayTeam']['name']?></span><i class="awayScoreAjax<?=$value2['id']?>"><?=$value2['score']['away']?></i></li></a>
                            </ul>

                            <i class="favorite findFav<?=$value2['id']?>" onclick="addFavorite('<?=$value2['id']?>')"></i>

                        </div>

                        <!-- For Mobile -->
                        <div class="forMobileThisMatch">
                            <ul class="frontInfos">
                                <li class="mbs uc"><i>3</i></li>
                                <li class="leauge"><?=$live['name']?></li>
                                <li class="time" style="margin-left: 10px;"><?=$baslangicSaati?></li>
                            </ul>
                            <ul class="mScores">
                                <li><span><?=$value2['homeTeam']['name']?></span><b><?=$value2['score']['home']?></b></li>
                                <li><span><?=$value2['awayTeam']['name']?></span><b><?=$value2['score']['away']?></b></li>
                            </ul>
                        </div>
                    </div>
                </div>
            <?php }

        endforeach;
        break;

    case 'saat':

        $match_list1 = sahadan($_GET['list'], date("Y-m-d"));
        $yesterday = date('Y-m-d',strtotime(date("Y-m-d") . "-1 days"));
        $match_list2 = sahadan($_GET['list'], $yesterday);
        foreach ($match_list2['data']['matches'] as $key => $value) {
            if($value['state'] == "live" && $value['substate'] != "suspended"){
                $live_match[] = $value;

                $live_match_id2[$value['id']] = true;
                foreach($match_list1['data']['competitions'] as $key_comp => $comp_value):
                    if($key_comp == $value['competitionId']){
                        $live_match_league[$value['competitionId']]['name'] = $comp_value['name'];
                        $live_match_league[$value['competitionId']]['country'] = $comp_value['country']['id'];
                    }
                endforeach;
            }
        }

        foreach ($match_list1['data']['matches'] as $key => $value) {
            if($value['state'] == "live" && $value['substate'] != "suspended"){
                if($live_match_id2[$value['id']] != true){
                    $live_match[] = $value;
                }




                foreach($match_list1['data']['competitions'] as $key_comp => $comp_value):
                    if($key_comp == $value['competitionId']){
                        $live_match_league[$value['competitionId']]['name'] = $comp_value['name'];
                        $live_match_league[$value['competitionId']]['country'] = $comp_value['country']['id'];
                    }
                endforeach;
            }
        }




        ?>
        <div class="leagueHead ingiltere"><i style="width: 26px; height: 26px;margin-top: 26px;margin-right: 8px;background: url('https://www.sahadan.com/img/flag-<?=$live_match_league[$key2]['country']?>-36x36.png')no-repeat center top #000000;"></i><span>Canlı Maçlar</span></div>
        <?php error_reporting(0); foreach ($live_match as $key3 => $value2) {

        $baslangicSaati = date("H:i",($value2['mstUtc'])/1000);
        $periodStatus =  intval((($value2['lastUpdated']/1000)-($value2['mstUtc']/1000))/60);
        $minutes =  intval((time()-($value2['periodStart']/1000))/60);

        if($periodStatus > 45){
            $minutes = $minutes+45;
        }

        $minutes = $minutes+1;
        if($value2['periodId'] == 10){
            $minutes = 'IY';
        }

        if($minutes > 90){
            $minutes_left = $minutes-90;
            $minutes = "90+".$minutes_left;
        }

        if(empty($value2['periodStart'])){
            $minutes = $value2['statusBoxContent'];
        }


        ?>
        <div class="matchAllAjax<?=$value2['id']?> matchAjaxBar">
            <input type="hidden" class="teamAjaxId" value="<?=$value2['id']?>" />
            <input type="hidden" class="redCardHomeAjax<?=$value2['id']?>" value="<?=$value2['redCards']['home']?>" />
            <input type="hidden" class="redCardAwayAjax<?=$value2['id']?>" value="<?=$value2['redCards']['away']?>" />
            <div class="thisMatch matchAjax<?=$value2['id']?>">
                <div class="rateBar">
                    <span class="time timeAjax<?=$value2['id']?>"><?=$baslangicSaati?></span>
                    <?php if($value['state'] == "live"){?>
                        <span class="live"><i>CANLI</i><b class="minuteAjax<?=$value2['id']?>"><?=$minutes?>’</b></span>
                    <?php } ?>
                    <ul class="teamLogos">
                        <li class="left homeLogo<?=$value2['id']?>"><img src="https://secure.cache.images.core.optasports.com/soccer/teams/30x30/uuid_<?=$value2['homeTeam']['id']?>.png" alt="<?=$value2['homeTeam']['name']?>" /></li>
                        <li class="right awayLogo<?=$value2['id']?>"><img src="https://secure.cache.images.core.optasports.com/soccer/teams/30x30/uuid_<?=$value2['awayTeam']['id']?>.png" alt="<?=$value2['awayTeam']['name']?>" /></li>
                    </ul>
                    <ul class="scores">
                        <a href="/mac-detay/?mac=<?=($value2['homeTeam']['slug']."-vs-".$value2['awayTeam']['slug'])?>&key=<?=$value2['id']?>"><li <?php if($value2['score']['home'] > $value2['score']['away']) echo 'class="winner"';?>><span class="homeName<?=$value2['id']?>"><?=$value2['homeTeam']['name']?></span><i class="homeScoreAjax<?=$value2['id']?>"><?=$value2['score']['home']?></i></li></a>
                        <a href="/mac-detay/?mac=<?=($value2['homeTeam']['slug']."-vs-".$value2['awayTeam']['slug'])?>&key=<?=$value2['id']?>"><li <?php if($value2['score']['home'] < $value2['score']['away']) echo 'class="winner"';?>><span class="awayName<?=$value2['id']?>"><?=$value2['awayTeam']['name']?></span><i class="awayScoreAjax<?=$value2['id']?>"><?=$value2['score']['away']?></i></li></a>
                    </ul>

                    <i class="favorite findFav<?=$value2['id']?>" onclick="addFavorite('<?=$value2['id']?>')"></i>

                </div>

                <!-- For Mobile -->
                <div class="forMobileThisMatch">
                    <ul class="frontInfos">
                        <li class="mbs uc"><i></i></li>
                        <li class="leauge"><?=$live['name']?></li>
                        <li class="time"><?=$baslangicSaati?></li>
                    </ul>
                    <ul class="mScores">
                        <li><span><?=$value2['homeTeam']['name']?></span><b>5</b></li>
                        <li><span><?=$value2['homeTeam']['away']?></span><b>2</b></li>
                    </ul>
                </div>
            </div>
        </div>
    <?php }

        break;


endswitch; ?>

<script>

    $(".dropdown dt a").on('click', function() {
        $(".dropdown dd ul").toggleClass("toggle");
        event.preventDefault();
        $(".dropdown i.arr").toggleClass("opened");
    });

    $(".dropdown dd ul li a").on('click', function() {
        $(".dropdown dd ul").hide();
        event.preventDefault();
    });

    function getSelectedValue(id) {
        return $("#" + id).find("dt a span.value").html();
    }

    $(document).bind('click', function(e) {
        var $clicked = $(e.target);
        if (!$clicked.parents().hasClass("dropdown")) $(".dropdown dd ul").hide();
    });

    $('.mutliSelect input[type="checkbox"]').on('click', function() {

        var title = $(this).closest('.mutliSelect').find('input[type="checkbox"]').val(),
            title = $(this).val() + ",";

        if ($(this).is(':checked')) {
            var html = '<span title="' + title + '">' + title + '</span>';
        } else {
            $('span[title="' + title + '"]').remove();
            var ret = $(".hida");
            $('.dropdown dt a').append(ret);

        }
    });

    function closeAllSelect(elmnt) {

        var x, y, i, arrNo = [];
        x = document.getElementsByClassName("select-items");
        y = document.getElementsByClassName("select-selected");
        for (i = 0; i < y.length; i++) {
            if (elmnt == y[i]) {
                arrNo.push(i)
            } else {
                y[i].classList.remove("select-arrow-active");
            }
        }
        for (i = 0; i < x.length; i++) {
            if (arrNo.indexOf(i)) {
                x[i].classList.add("select-hide");
            }
        }
    }


    $(document).ready(function(){
        $(".liveResults .thisMatches .thisMatch .othRates").hide();
        $(".liveResults .thisMatches .thisMatch span.more").click(function(){
            $(".liveResults .thisMatches .thisMatch .othRates").hide();
            $(this).parents('.thisMatch').find( ".othRates" ).show();
        });
    });

    $(document).ready(function(){
        $(".standings .table ul.league").hide();
        $(".standings .table ul.league:first").show();
        $(".standings .table ul.leagues li:first").addClass("active");
        $(".standings .table ul.leagues li").click(function(){
            $(".standings .table ul.leagues li").removeClass("active");
            $(this).addClass("active");
            $(".standings .table ul.league").hide();
            var tab = $(this).index();
            $(".standings .table ul.league:eq("+tab+")").fadeIn();
            return false;
        });
    });

    $(document).ready(function(){
        $(".liveResults .thisMatches").hide();
        $(".liveResults .thisMatches").eq(1).show();
        $(".liveResults .liveBar ul.tabPages li").eq(1).addClass("active");
        $(".liveResults .liveBar ul.tabPages li").click(function(){
            $(".liveResults .liveBar ul.tabPages li").removeClass("active");
            $(this).addClass("active");
            $(".liveResults .thisMatches").hide();
            var tab = $(this).index();
            $(".liveResults .thisMatches:eq("+tab+")").fadeIn();
            return false;
        });
    });


</script>

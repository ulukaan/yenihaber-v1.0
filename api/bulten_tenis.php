<?php
include 'api_helper.php';
$s = 0;
$get_futbol_bulten =  json_decode(misli_bulten("TENIS"), true);

$match_data[zamantr(time())][999999] = '';
$match_data[zamantr(time()+(86400*1))][999999] = '';
?><center><p style="position:relative;top: 20px;"> Seçtiğiniz kriterlere uygun herhangi bir etkinlik bulunmamaktadır. </p></center><?php
exit();
foreach ($get_futbol_bulten['data']['e'] as $key => $value) {
    $match_lig    = $value['ct'];
    $match_time   = ($value['d']/1000);
    $match_mbs    = $value['mbs'];
    $match_name   = $value['p'][0]['n']." - ".$value['p'][1]['n'];
    $match_code   = $value['i'];

    $match_time = zamantr($match_time);

    foreach ($value['m'] as $key_odds => $value_odds) {
        $match_odds[$key][$key_odds] = $value_odds['n'];

        if($value_odds['n'] == "Maç Sonucu"){
            $match_odds['ms_1'] = number_format($value_odds['o'][0]['od'],2);
            $match_odds['ms_x'] = number_format($value_odds['o'][1]['od'],2);
            $match_odds['ms_2'] = number_format($value_odds['o'][2]['od'],2);

            if($value_odds['o'][0]['od'] < $value_odds['o'][0]['oh']['od']) {
                $match_odds['ms_1_cs'] = 2;
            }else{
                if($value_odds['o'][0]['oh']['od'] != $value_odds['o'][0]['od']) $match_odds['ms_1_cs'] = 1;
            }

            if($value_odds['o'][1]['od'] < $value_odds['o'][1]['oh']['od']) {
                $match_odds['ms_x_cs'] = 2;
            }else{
                if($value_odds['o'][1]['oh']['od'] != $value_odds['o'][1]['od'])  $match_odds['ms_x_cs'] = 1;
            }

            if($value_odds['o'][2]['od'] < $value_odds['o'][2]['oh']['od']) {
                $match_odds['ms_2_cs'] = 2;
            }else{
                if($value_odds['o'][2]['oh']['od'] != $value_odds['o'][2]['od'])  $match_odds['ms_2_cs'] = 1;
            }
        }

        if($value_odds['n'] == "Altı/Üstü 2,5")
        {
            $match_odds['au_25_a'] = number_format($value_odds['o'][0]['od'],2);
            $match_odds['au_25_u'] = number_format($value_odds['o'][1]['od'],2);

            $match_odds['au_25_a_cs'] = $value_odds['o'][0]['n'];
            $match_odds['au_25_u_cs'] = $value_odds['o'][1]['n'];

            if($value_odds['o'][0]['od'] < $value_odds['o'][0]['oh']['od']) {
                $match_odds['au_25_a_cs'] = 2;
            }else{
                if($value_odds['o'][0]['oh']['od'] != $value_odds['o'][0]['od'])  $match_odds['au_25_a_cs'] = 1;
            }

            if($value_odds['o'][1]['od'] < $value_odds['o'][1]['oh']['od']) {
                $match_odds['au_25_u_cs'] = 2;
            }else{
                if($value_odds['o'][1]['oh']['od'] != $value_odds['o'][1]['od'])  $match_odds['au_25_u_cs'] = 1;
            }
        }
    }

    // Start single market values.
    $market_value = json_decode( misli_market($match_code), true );
    foreach($market_value['data']['m'] as $key_market=>$value_market):
        if($value_market['n'] == "Karşılıklı Gol")
        {
            $match_odds['kg_var'] = number_format($value_market['o'][0]['od'],2);
            $match_odds['kg_yok'] = number_format($value_market['o'][1]['od'],2);

            if($value_market['o'][0]['od'] < $value_market['o'][0]['oh']['od']) {
                $match_odds['kg_var_cs'] = 2;
            }else{
                if($value_market['o'][0]['oh']['od'] != $value_market['o'][0]['od'])  $match_odds['kg_var_cs'] = 1;
            }

            if($value_market['o'][1]['od'] < $value_market['o'][1]['oh']['od']) {
                $match_odds['kg_yok_cs'] = 2;
            }else{
                if($value_market['o'][1]['oh']['od'] != $value_market['o'][1]['od'])  $match_odds['kg_yok_cs'] = 1;
            }

        }

        if($value_market['n'] == "İlk Yarı Sonucu"){
            $match_odds['ig_1'] = number_format($value_market['o'][0]['od'],2);
            $match_odds['ig_x'] = number_format($value_market['o'][1]['od'],2);
            $match_odds['ig_2'] = number_format($value_market['o'][2]['od'],2);

            if($value_market['o'][0]['od'] < $value_market['o'][0]['oh']['od']) {
                $match_odds['ig_1_cs'] = 2;
            }else{
                if($value_market['o'][0]['oh']['od'] != $value_market['o'][0]['od'])  $match_odds['ig_1_cs'] = 1;
            }

            if($value_market['o'][1]['od'] < $value_market['o'][1]['oh']['od']) {
                $match_odds['ig_x_cs'] = 2;
            }else{
                if($value_market['o'][1]['oh']['od'] != $value_market['o'][1]['od'])  $match_odds['ig_x_cs'] = 1;
            }

            if($value_market['o'][2]['od'] < $value_market['o'][2]['oh']['od']) {
                $match_odds['ig_2_cs'] = 2;
            }else{
                if($value_market['o'][2]['oh']['od'] != $value_market['o'][2]['od'])  $match_odds['ig_2_cs'] = 1;
            }
        }

        if($value_market['n'] == "Toplam Gol"){
            $match_odds['tg_1'] = number_format($value_market['o'][0]['od'],2);
            $match_odds['tg_2'] = number_format($value_market['o'][1]['od'],2);
            $match_odds['tg_3'] = number_format($value_market['o'][2]['od'],2);
            $match_odds['tg_4'] = number_format($value_market['o'][3]['od'],2);

            if($value_market['o'][0]['od'] < $value_market['o'][0]['oh']['od']) {
                $match_odds['tg_1_cs'] = 2;
            }else{
                if($value_market['o'][0]['oh']['od'] != $value_market['o'][0]['od'])  $match_odds['tg_1_cs'] = 1;
            }

            if($value_market['o'][1]['od'] < $value_market['o'][1]['oh']['od']) {
                $match_odds['tg_2_cs'] = 2;
            }else{
                if($value_market['o'][0]['oh']['od'] != $value_market['o'][0]['od'])  $match_odds['tg_2_cs'] = 1;
            }

            if($value_market['o'][2]['od'] < $value_market['o'][2]['oh']['od']) {
                $match_odds['tg_3_cs'] = 2;
            }else{
                if($value_market['o'][0]['oh']['od'] != $value_market['o'][0]['od'])  $match_odds['tg_3_cs'] = 1;
            }

            if($value_market['o'][3]['od'] < $value_market['o'][3]['oh']['od']) {
                $match_odds['tg_4_cs'] = 2;
            }else{
                if($value_market['o'][0]['oh']['od'] != $value_market['o'][0]['od'])  $match_odds['tg_4_cs'] = 1;
            }


        }

        if($value_market['n'] == "Tek/Çift"){
            $match_odds['tc_1'] = number_format($value_market['o'][0]['od'],2);
            $match_odds['tc_2'] = number_format($value_market['o'][1]['od'],2);

            if($value_market['o'][0]['od'] < $value_market['o'][0]['oh']['od']) {
                $match_odds['tc_1_cs'] = 2;
            }else{
                if($value_market['o'][0]['oh']['od'] != $value_market['o'][0]['od'])  $match_odds['tc_1_cs'] = 1;
            }

            if($value_market['o'][1]['od'] < $value_market['o'][1]['oh']['od']) {
                $match_odds['tc_2_cs'] = 2;
            }else{
                if($value_market['o'][1]['oh']['od'] != $value_market['o'][1]['od'])  $match_odds['tc_2_cs'] = 1;
            }
        }

    endforeach;
    // End single market values.

    if(empty($match_mbs)) $match_mbs = "1";
    $match_data[$match_time][$s]['lig'] = $match_lig;
    $match_data[$match_time][$s]['time'] = ($value['d']/1000);
    $match_data[$match_time][$s]['mbs'] = $match_mbs;
    $match_data[$match_time][$s]['name'] = $match_name;
    $match_data[$match_time][$s]['odds'] = $match_odds;
    $match_data[$match_time][$s]['code'] = $match_code;
    $match_data[$match_time][$s]['total'] = $value['t'];

    $s++;


}


?>
<div id="matchListArea">
    <?php foreach($match_data as $key2=>$data):
        $tarih_data[] = $key2;

        if(!empty($_GET['date'])) {
            $date = urldecode($_GET['date']);

            if($key2 != $date) continue;
        }
        ?>
        <!-- Sticky Header -->
        <div class="sHeader headerS<?=strtotime($key2)?>">
            <!-- First Headline -->
            <div class="firstHeadline">
                <ul>
                    <li class="tarih"><?=($key2)?></li>
                    <li class="ms">Maç Sonucu</li>
                    </ul>
            </div>

            <!-- Second Headline -->
            <div class="secondHeadline">
                <ul>
                    <li class="lig tCenter">LİG</li>
                    <li class="lig saat tCenter">SAAT</li>
                    <li class="lig mbs tCenter">MBS</li>
                    <li class="takimlar tLeft bRightBlack">EV SAHİBİ - KONUK TAKIM</li>
                    <li class="bsi tCenter">1<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter bRightBlack">2<i class="up"></i><i class="down"></i></li>
                </ul>
            </div>

        </div>

        <!-- Matches -->
        <div class="nPMatches">
            <?php foreach($match_data[$key2] as $key=>$match_value):
                if($_GET['mbs'] != 0){
                    if($match_value['mbs'] != $_GET['mbs']){
                        continue;
                    }else{
                        $match_search[$key2]['mbs'] = $match_search[$key2]['mbs']+1;
                    }

                }

                if(empty($match_value['name'])){
                    continue;
                }
                ?>
                <div class="nPMatch" data-name="<?=$match_value['name']?>" data-date="<?=$key2?>">
                    <ul class="fDatas">
                        <li class="lig tCenter"><?=mb_substr($match_value['lig'],0,5)?></li>
                        <li class="saat tCenter"><?=date("H:i",$match_value['time'])?></li>
                        <li class="mbs tCenter"><i class="<?=mbs_to_string($match_value['mbs'])?>"><?=$match_value['mbs']?></i></li>
                        <li class="takimlar tLeft bRightBlack"><?=$match_value['name']?></li>
                        <li class="bsi tCenter <?=cs_status($match_value['odds']['ms_1_cs'])?>" onclick="addOdd('<?=$match_value['name']?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_value['odds']['ms_1']?>', 'MS 1', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_value['odds']['ms_1']?></li>
                        <li class="bsi tCenter bRightBlack <?=cs_status($match_value['odds']['ms_x_cs'])?>" onclick="addOdd('<?=$match_value['name']?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_value['odds']['ms_x']?>', 'MS X', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_value['odds']['ms_x']?></li>
                        <li class="plus"><a href="javascript:;" onclick="match_data(<?=$match_code[$key2][$key]?>);"><i>+<?=$match_value['total']?></i></a></li>
                    </ul>
                    <div class="tumOranlar">

                        <div class="bas"><span>Tüm Oranlar</span><i class="close"></i></div>
                        <?php

                        foreach($market_value['data']['m'] as $key_odds_data_r=>$value_odds_data_r): ?>
                            <div class="oranItem">
                                <div class="text"><span><?=$value_odds_data_r['n']?></span></div>
                                <ul>
                                    <li class="mbs <?=mbs_to_string($value_odds_data_r['min'])?>"><span>MBS</span><i><?=$value_odds_data_r['min']?></i></li>
                                    <?php foreach($value_odds_data_r['o'] as $key_odds_data=>$value_odds_data): ?>
                                        <li onclick="addOdd('<?=$match_value['name']?>','<?=$match_value['code']?>', '<?=$match_value['mbs']?>', '<?=$value_odds_data['od']?>', '<?=$value_odds_data_r['n']?> <?=$value_odds_data['n']?>', '<?=$match_value['lig']?>','<?=strtotime($key2)?>', '')"><span><?=$value_odds_data['n']?></span><i><?=$value_odds_data['od']?></i></li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>

                        <?php endforeach; ?>

                    </div>

                    <!-- For Mobile -->
                    <div class="forMobileMatch" data-name="<?=$match_data?>" data-date="<?=$key2?>">
                        <span class="matchTitle"><?=$match_data?></span>
                        <ul class="frontInfos">
                            <li class="mbs <?=mbs_to_string($match_mbs[$key2][$key])?>"><i>3</i></li>
                            <li class="leauge"><?=mb_substr($match_lig[$key2][$key],0,5)?></li>
                            <li class="time"><?=$match_hour[$key2][$key]?></li>
                        </ul>
                        <ul class="oth">
                            <li class="code_<?=$match_code[$key2][$key]?>_1" onclick="addOddMobil('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_value['odds']['ms_1']?>', 'MS 1', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><span>1</span><p><?=$match_value['odds']['ms_1']?></p></li>
                            <li class="code_<?=$match_code[$key2][$key]?>_x" onclick="addOddMobil('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_value['odds']['ms_x']?>', 'MS X', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><span>0</span><p><?=$match_value['odds']['ms_x']?></p></li>
                            <li class="code_<?=$match_code[$key2][$key]?>_2" onclick="addOddMobil('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_value['odds']['ms_2']?>', 'MS 2', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><span>2</span><p><?=$match_value['odds']['ms_2']?></p></li>
                            <li class="othMore"><a href="/tum-oranlar?key=<?=$key?>&type=football">+<?=$match_value['total']?></a></li>
                        </ul>
                    </div>

                </div>
            <?php endforeach; ?>



        </div>

    <?php

    endforeach;
    foreach ($match_search as $key => $value) {
        if($value == 0){
            $showNotFound = false;
        }else{
            $showNotFound = true;
        }
    }
    foreach($match_search as $key2=>$data):
        if($_GET['lig'] != '0' || $_GET['date'] != '0' || $_GET['mbs'] != '0'){
            if(@$match_search[$key2]['date'] != 0 || $match_search[$key2]['lig'] != 0 || $match_search[$key2]['mbs'] != 0 ){
                if($_GET['lig'] != '0' && $_GET['date'] != '0'){

                    if($match_search[$key2]['lig'] == 0 || $match_search[$key2]['date'] == 0){
                        ?>
                        <style>
                            .headerS<?=$key2?>{display: none;}
                        </style>
                        <?php
                    }
                }

                if($_GET['lig'] != '0' && $_GET['date'] != '0' && $_GET['mbs'] != '0'){
                    if($match_search[$key2]['lig'] == 0 || $match_search[$key2]['mbs'] == 0 || $match_search[$key2]['date'] == 0){
                        ?>
                        <style>
                            .headerS<?=$key2?>{display: none;}
                        </style>
                        <?php
                    }
                }

                if($_GET['mbs'] != '0' && $_GET['date'] != '0'){
                    if($match_search[$key2]['date'] == 0 || $match_search[$key2]['mbs'] == 0){
                        ?>
                        <style>
                            .headerS<?=$key2?>{display: none;}
                        </style>
                        <?php
                    }
                }

                if($_GET['lig'] != '0' && $_GET['mbs'] != '0'){
                    if($match_search[$key2]['lig'] == 0 || $match_search[$key2]['date'] == 0){
                        ?>
                        <style>
                            .headerS<?=$key2?>{display: none;}
                        </style>
                        <?php
                    }
                }

                ?>
                <style>
                    .headerS<?=$key2?>{display: none;}
                </style>
                <?php
            }else{
                ?>
                <style>
                    .headerS<?=$key2?>{display: none;}
                </style>
                <?php
            }
        }
    endforeach;

    if($showNotFound == true){
        ?><p></p><?php
    }
    ?>
</div>

<div class="ligData" style="display: none"><?php
    foreach (array_unique($lig_data) as $key5 => $lig) {
        if(!empty($lig)){
            ?>
            <li onclick="changeLig('<?=$lig?>')"><p><?=$lig?></p></li>
            <?php
        }
    }

    ?>
</div>

<div class="tarihData" style="display: none"><?php
    foreach (array_unique($tarih_data) as $key5 => $tarih) {
        ?>
        <li onclick="changeDate('<?=$tarih?>')"><p><?=$tarih?></p></li>
        <?php

    }

    ?>
</div>
<script>

    document.addEventListener("click", closeAllSelect);

    $(document).ready(function(){
        $(".content .nPMatches .nPMatch .tumOranlar").hide();
        $(".content .nPMatches ul.fDatas li.plus").click(function(){
            $(".content .nPMatches .nPMatch .tumOranlar").hide();

            var oranlar_status = $(this).parents('ul').parents('.nPMatch').find( ".tumOranlar" ).is(":visible");

            if(oranlar_status == true){
                $(this).parents('ul').parents('.nPMatch').find( ".tumOranlar" ).hide();
            }else{
                $(this).parents('ul').parents('.nPMatch').find( ".tumOranlar" ).show();
            }
        });
        $(".content .nPMatches .nPMatch .tumOranlar .bas i.close").click(function(){
            $(this).parents('div.tumOranlar').hide();
        });
    });


</script>
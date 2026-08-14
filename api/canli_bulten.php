<?php
include 'api_helper.php';

$get_futbol_bulten =  json_decode(misli_canli(), true)[''];

exit();
if(!function_exists('mbs_to_string')):
    function mbs_to_string($int)
    {
        $search_int  = array(1,2,3,4,5,6);
        $find_str    = array('bir', 'iki', 'uc', 'dort','bes','alti');

        return str_replace($search_int, $find_str, $int);
    }
endif;

if(!function_exists('cs_status')):
    function cs_status($str)
    {
        $search = array(1, 2);
        $find = array('up', 'down');

        return str_replace($search, $find, $str);
    }
endif;
foreach ($get_futbol_bulten['BL'] as $key => $value) {
    $key = $key.$i;
    $cd = date("d-m-Y",(substr(str_replace(")/",null,explode("/Date(",$value['CD'])[1]), 0, 10)  + 3 * 3600));
    $match_name[$cd][$key] = $value['BN'];
    $match_code[$cd][$key] = $value['BI'];
    //foreach ($get_futbol_bulten['BTL'][0]['CL'] as $key_lig => $value_lig) {
    //foreach ($value_lig['LL'] as $key_lig_data => $value_lig_data) {
    //if($value_lig_data['LI'] == $value['LI']){
    $match_lig[$cd][$key] = $value['LN'];
    $match_hour[$cd][$key] = $value['H'];
    $match_oc[$cd][$key] = $value['OC'];
    //}
    //}
    //}



    $match_mbs[$cd][$key] = $value['MBC'];

    foreach ($value['ML'] as $key_odds => $value_odds) {
        if($value_odds['MN'] == "İlk Golü Hangi Takım Atar"){
            $match_odds[$cd][$key]['ig_1'] = number_format($value_odds['OL'][0]['O'],2);
            $match_odds[$cd][$key]['ig_x'] = number_format($value_odds['OL'][1]['O'],2);
            $match_odds[$cd][$key]['ig_2'] = number_format($value_odds['OL'][2]['O'],2);

            $match_odds[$cd][$key]['ig_1_cs'] = $value_odds['OL'][0]['OCF'];
            $match_odds[$cd][$key]['ig_x_cs'] = $value_odds['OL'][1]['OCF'];
            $match_odds[$cd][$key]['ig_2_cs'] = $value_odds['OL'][2]['OCF'];
        }

        if($value_odds['MN'] == "Maç Sonucu"){


            $match_odds[$cd][$key]['ms_1'] = number_format($value_odds['OL'][0]['O'],2);
            $match_odds[$cd][$key]['ms_x'] = number_format($value_odds['OL'][1]['O'],2);
            $match_odds[$cd][$key]['ms_2'] = number_format($value_odds['OL'][2]['O'],2);

            $match_odds[$cd][$key]['ms_1_cs'] = $value_odds['OL'][0]['OCF'];
            $match_odds[$cd][$key]['ms_x_cs'] = $value_odds['OL'][1]['OCF'];
            $match_odds[$cd][$key]['ms_2_cs'] = $value_odds['OL'][2]['OCF'];
        }

        if($value_odds['MN'] == "Maç Sonucu ve Altı/Üstü 1,5")
        {
            $match_odds[$cd][$key]['ms_au_1a'] = number_format($value_odds['OL'][0]['O'],2);
            $match_odds[$cd][$key]['ms_au_0a'] = number_format($value_odds['OL'][1]['O'],2);
            $match_odds[$cd][$key]['ms_au_2a'] = number_format($value_odds['OL'][2]['O'],2);

            $match_odds[$cd][$key]['ms_au_1u'] = number_format($value_odds['OL'][3]['O'],2);
            $match_odds[$cd][$key]['ms_au_0u'] = number_format($value_odds['OL'][4]['O'],2);
            $match_odds[$cd][$key]['ms_au_2u'] = number_format($value_odds['OL'][5]['O'],2);

            $match_odds[$cd][$key]['ms_au_1a_cs'] = $value_odds['OL'][0]['OCF'];
            $match_odds[$cd][$key]['ms_au_0a_cs'] = $value_odds['OL'][1]['OCF'];
            $match_odds[$cd][$key]['ms_au_2a_cs'] = $value_odds['OL'][2]['OCF'];

            $match_odds[$cd][$key]['ms_au_1u_cs'] = $value_odds['OL'][3]['OCF'];
            $match_odds[$cd][$key]['ms_au_0u_cs'] = $value_odds['OL'][4]['OCF'];
            $match_odds[$cd][$key]['ms_au_2u_cs'] = $value_odds['OL'][5]['OCF'];
        }

        if($value_odds['MN'] == "Altı/Üstü 2,5")
        {
            $match_odds[$cd][$key]['au_25_a'] = number_format($value_odds['OL'][0]['O'],2);
            $match_odds[$cd][$key]['au_25_u'] = number_format($value_odds['OL'][1]['O'],2);

            $match_odds[$cd][$key]['au_25_a_cs'] = $value_odds['OL'][0]['OCF'];
            $match_odds[$cd][$key]['au_25_u_cs'] = $value_odds['OL'][1]['OCF'];
        }

        if($value_odds['MN'] == "Karşılıklı Gol")
        {
            $match_odds[$cd][$key]['kg_var'] = number_format($value_odds['OL'][0]['O'],2);
            $match_odds[$cd][$key]['kg_yok'] = number_format($value_odds['OL'][1]['O'],2);

            $match_odds[$cd][$key]['kg_var_cs'] = $value_odds['OL'][0]['OCF'];
            $match_odds[$cd][$key]['kg_yok_cs'] = $value_odds['OL'][1]['OCF'];
        }


    }

}
?><div id="matchListArea"><?php
    foreach($match_name as $key2=>$match_data): ?>
        <!-- Sticky Header -->
        <div class="sHeader">
            <!-- First Headline -->
            <div class="firstHeadline">
                <ul>
                    <li class="tarih"><?=$key2?></li>
                    <li class="ms">Maç Sonucu</li>
                    <li class="ilkGol">İlk Golü Kim Atar</li>
                    <li class="msAU">Maç Sonucu ve A/Ü</li>
                    <li class="AU">2,5 A/Ü</li>
                    <li class="karGol">Karş. Gol</li>
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
                    <li class="bsi tCenter up">0<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter bRightBlack">2<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter">1<i class="up"></i><i class="down"></i></li>
                    <li class="olmaz tCenter">OLMAZ<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter bRightBlack">2<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter">1/A<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter">0/A<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter">2/A<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter">1/Ü<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter">0/Ü<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter bRightBlack">2/Ü<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter">ALT<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter bRightBlack">ÜST<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter">VAR<i class="up"></i><i class="down"></i></li>
                    <li class="bsi tCenter bRightBlack">YOK<i class="up"></i><i class="down"></i></li>
                </ul>
            </div>

        </div>

        <!-- Matches -->
        <div class="nPMatches">
            <?php foreach($match_name[$key2] as $key=>$match_data):
                if($_GET['mbs'] != 0){
                    if($match_mbs[$key2][$key] != $_GET['mbs']){
                        continue;
                    }
                }
                ?>

                <div class="nPMatch" data-name="<?=$match_data?>">
                    <ul class="fDatas">
                        <li class="lig tCenter"><?=mb_substr($match_lig[$key2][$key],0,5)?></li>
                        <li class="saat tCenter"><?=$match_hour[$key2][$key]?></li>
                        <li class="mbs tCenter"><i class="<?=mbs_to_string($match_mbs[$key2][$key])?>"><?=$match_mbs[$key2][$key]?></i></li>
                        <li class="takimlar tLeft bRightBlack"><?=$match_data?></li>
                        <li class="bsi tCenter <?=cs_status($match_odds[$key2][$key]['ms_1_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ms_1']?>', 'MS 1', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ms_1']?></li>
                        <li class="bsi tCenter <?=cs_status($match_odds[$key2][$key]['ms_x_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ms_x']?>', 'MS X', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ms_x']?></li>
                        <li class="bsi tCenter bRightBlack <?=cs_status($match_odds[$key2][$key]['ms_2_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ms_2']?>', 'MS 2', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ms_2']?></li>
                        <li class="bsi tCenter <?=cs_status($match_odds[$key2][$key]['ig_1_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ig_1']?>', 'IG 1', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ig_1']?></li>
                        <li class="olmaz tCenter <?=cs_status($match_odds[$key2][$key]['ig_x_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ig_x']?>', 'İG X', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ig_x']?></li>
                        <li class="bsi tCenter bRightBlack <?=cs_status($match_odds[$key2][$key]['ig_2_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ig_2']?>', 'İG 2', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ig_2']?></li>
                        <li class="bsi tCenter <?=cs_status($match_odds[$key2][$key]['ms_au_1a_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ms_au_1a']?>', 'MS A/Ü 1/A', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ms_au_1a']?></li>
                        <li class="bsi tCenter <?=cs_status($match_odds[$key2][$key]['ms_au_0a_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ms_au_0a']?>', 'MS A/Ü 0/A', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ms_au_0a']?></li>
                        <li class="bsi tCenter <?=cs_status($match_odds[$key2][$key]['ms_au_2a_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ms_au_2a']?>', 'MS A/Ü 2/A', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ms_au_2a']?></li>
                        <li class="bsi tCenter <?=cs_status($match_odds[$key2][$key]['ms_au_1u_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ms_au_1u']?>', 'MS A/Ü 1/Ü', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ms_au_1u']?></li>
                        <li class="bsi tCenter <?=cs_status($match_odds[$key2][$key]['ms_au_0u_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ms_au_0u']?>', 'MS A/Ü 0/Ü', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ms_au_0u']?></li>
                        <li class="bsi tCenter bRightBlack <?=cs_status($match_odds[$key2][$key]['ms_au_2u_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ms_au_2u']?>', 'MS A/Ü 2/Ü', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['ms_au_2u']?></li>
                        <li class="bsi tCenter <?=cs_status($match_odds[$key2][$key]['au_25_a_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['au_25_a']?>', 'AÜ 2,5 Alt', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['au_25_a']?></li>
                        <li class="bsi tCenter bRightBlack <?=cs_status($match_odds[$key2][$key]['au_25_u_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['au_25_u']?>', 'AÜ 2,5 Üst', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['au_25_u']?></li>
                        <li class="bsi tCenter <?=cs_status($match_odds[$key2][$key]['kg_var_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['kg_var']?>', 'KG VAR', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['kg_var']?></li>
                        <li class="bsi tCenter bRightBlack <?=cs_status($match_odds[$key2][$key]['kg_yok_cs'])?>" onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['kg_yok']?>', 'KG YOK', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><i></i><?=$match_odds[$key2][$key]['kg_yok']?></li>
                        <li class="plus"><a href="javascript:;" onclick="match_data(<?=$match_code[$key2][$key]?>);"><i>+<?=$match_oc[$key2][$key]?></i></a></li>
                    </ul>
                    <div class="tumOranlar">

                        <div class="bas"><span>Tüm Oranlar</span><i class="close"></i></div>
                        <?php foreach($value['ML'] as $key_odds=>$value_odds): ?>
                            <div class="oranItem">
                                <div class="text"><span><?=$value_odds['MN']?></span></div>
                                <ul>
                                    <li class="mbs <?=mbs_to_string($value_odds['OL'][0]['MBC'])?>"><span>MBS</span><i><?=$value_odds['OL'][0]['MBC']?></i></li>
                                    <?php foreach($value_odds['OL'] as $key_odds_data=>$value_odds_data): ?>
                                        <li onclick="addOdd('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$value_odds_data['O']?>', '<?=$value_odds['MN']?> <?=$value_odds_data['CSN']?>', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><span><?=$value_odds_data['CSN']?></span><i><?=$value_odds_data['O']?></i></li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>

                        <?php endforeach; ?>

                    </div>

                    <!-- For Mobile -->
                    <div class="forMobileMatch">
                        <span class="matchTitle"><?=$match_data?></span>
                        <ul class="frontInfos">
                            <li class="mbs <?=mbs_to_string($match_mbs[$key2][$key])?>"><i>3</i></li>
                            <li class="leauge"><?=mb_substr($match_lig[$key2][$key],0,5)?></li>
                            <li class="time"><?=$match_hour[$key2][$key]?></li>
                        </ul>
                        <ul class="oth">
                            <li onclick="addOddMobil('<?=$match_data?>','<?=$match_code[$key2][$key]?>', '<?=$match_mbs[$key2][$key]?>', '<?=$match_odds[$key2][$key]['ms_1']?>', 'MS 1', '<?=$match_lig[$key2][$key]?>','<?=strtotime($key2)?>', '<?=$match_hour[$key2][$key]?>')"><span>1</span><p><?=$match_odds[$key2][$key]['ms_1']?></p></li>
                            <li><span>0</span><p><?=$match_odds[$key2][$key]['ms_x']?></p></li>
                            <li><span>2</span><p><?=$match_odds[$key2][$key]['ms_2']?></p></li>
                            <li class="othMore"><a href="/tum-oranlar?key=<?=$key?>&type=football">+<?=$match_oc[$key2][$key]?></a></li>
                        </ul>
                    </div>

                </div>
            <?php endforeach; ?>



        </div>

    <?php endforeach; ?>
</div>
<script>

    var x, i, j, selElmnt, a, b, c;

    x = document.getElementsByClassName("newDSelect");
    for (i = 0; i < x.length; i++) {
        selElmnt = x[i].getElementsByTagName("select")[0];

        a = document.createElement("DIV");
        a.setAttribute("class", "select-selected");
        a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
        x[i].appendChild(a);

        b = document.createElement("DIV");
        b.setAttribute("class", "select-items select-hide");
        for (j = 1; j < selElmnt.length; j++) {

            c = document.createElement("DIV");
            c.innerHTML = selElmnt.options[j].innerHTML;
            c.addEventListener("click", function(e) {

                var y, i, k, s, h;
                s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                h = this.parentNode.previousSibling;
                for (i = 0; i < s.length; i++) {
                    if (s.options[i].innerHTML == this.innerHTML) {
                        s.selectedIndex = i;
                        h.innerHTML = this.innerHTML;
                        y = this.parentNode.getElementsByClassName("same-as-selected");
                        for (k = 0; k < y.length; k++) {
                            y[k].removeAttribute("class");
                        }
                        this.setAttribute("class", "same-as-selected");
                        break;
                    }
                }
                h.click();
            });
            b.appendChild(c);
        }
        x[i].appendChild(b);
        a.addEventListener("click", function(e) {

            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
        });
    }

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


    document.addEventListener("click", closeAllSelect);

    $(document).ready(function(){
        $(".content .nPMatches .nPMatch .tumOranlar").hide();
        $(".content .nPMatches ul.fDatas li.plus").click(function(){
            $(".content .nPMatches .nPMatch .tumOranlar").hide();
            $(this).parents('ul').parents('.nPMatch').find( ".tumOranlar" ).toggle();
        });
        $(".content .nPMatches .nPMatch .tumOranlar .bas i.close").click(function(){
            $(this).parents('div.tumOranlar').hide();
        });
    });

    $(document).ready(function(){
        $(".sportsTab").hide();
        $(".sportsTab:first").show();
        $(".content .iddaaP .chooseSport ul li:first").addClass("active");
        $(".content .iddaaP .chooseSport ul li").click(function(){
            $(".content .iddaaP .chooseSport ul li").removeClass("active");
            $(this).addClass("active");
            $(".sportsTab").hide();
            var tab = $(this).index();
            $(".sportsTab:eq("+tab+")").fadeIn();
            return false;
        });
    });
</script>

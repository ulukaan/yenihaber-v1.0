<?php
include 'api_helper.php';
include 'DataCacheBahis.php';

$s = 0;

$DataCache = new DataCacheBahis(30);


if ($bulten = $DataCache->get('bulten.json')) {
    $get_futbol_bulten = $bulten;
} else {
	$source = misli_bulten("SOCCER");
	$get_futbol_bulten = json_decode($source, true);
    $DataCache->write('bulten.json', $get_futbol_bulten);
}

$sorting_array = sortAssociativeArrayByKey($get_futbol_bulten['data']['e'], "d", "ASC");

foreach ($sorting_array as $key => $value) {
    if($s > 120){
        break;
    }
    $match_lig = $value['ct'];
    $match_time = ($value['d'] / 1000);
    $match_mbs = $value['mbs'];
    $match_name = $value['p'][0]['n'] . " - " . $value['p'][1]['n'];
    $match_code = $value['i'];

    $match_time = zamantr($match_time);

    foreach ($value['m'] as $key_odds => $value_odds) {
        $match_odds[$key][$key_odds] = $value_odds['n'];

        if ($value_odds['t'] == "1" && $value_odds['s'] == "1") {
            $match_odds['ms_1'] = number_format($value_odds['o'][0]['od'], 2);
            $match_odds['ms_x'] = number_format($value_odds['o'][1]['od'], 2);
            $match_odds['ms_2'] = number_format($value_odds['o'][2]['od'], 2);

            if ($value_odds['o'][0]['od'] < $value_odds['o'][0]['lodd']) {
                $match_odds['ms_1_cs'] = 2;
            } else {
                if ($value_odds['o'][0]['lodd'] != $value_odds['o'][0]['od']) $match_odds['ms_1_cs'] = 1;
            }

            if ($value_odds['o'][1]['od'] < $value_odds['o'][1]['lodd']) {
                $match_odds['ms_x_cs'] = 2;
            } else {
                if ($value_odds['o'][1]['lodd'] != $value_odds['o'][1]['od']) $match_odds['ms_x_cs'] = 1;
            }

            if ($value_odds['o'][2]['od'] < $value_odds['o'][2]['lodd']) {
                $match_odds['ms_2_cs'] = 2;
            } else {
                if ($value_odds['o'][2]['lodd'] != $value_odds['o'][2]['od']) $match_odds['ms_2_cs'] = 1;
            }
        }

        if ($value_odds['t'] == "2" && $value_odds['s'] == "101") {

            $match_odds['au_25_a'] = number_format($value_odds['o'][0]['od'], 2);
            $match_odds['au_25_u'] = number_format($value_odds['o'][1]['od'], 2);

            $match_odds['au_25_a_cs'] = $value_odds['o'][0]['n'];
            $match_odds['au_25_u_cs'] = $value_odds['o'][1]['n'];

            if ($value_odds['o'][0]['od'] < $value_odds['o'][0]['lodd']) {
                $match_odds['au_25_a_cs'] = 2;
            } else {
                if ($value_odds['o'][0]['lodd'] != $value_odds['o'][0]['od']) $match_odds['au_25_a_cs'] = 1;
            }

            if ($value_odds['o'][1]['od'] < $value_odds['o'][1]['lodd']) {
                $match_odds['au_25_u_cs'] = 2;
            } else {
                if ($value_odds['o'][1]['lodd'] != $value_odds['o'][1]['od']) $match_odds['au_25_u_cs'] = 1;
            }
        }
    }

    // Start single market values.
	
	
	if ($market_value = $DataCache->get('bulten_'.$match_code.'.json')) {
} else {
    $market_value = json_decode(misli_market($match_code), true);
    $DataCache->write('bulten_'.$match_code.'.json', $market_value);
}



    foreach ($market_value['data']['m'] as $key_market => $value_market):
        if ($value_market['s'] == "1" && $value_market['st'] == "89") {
            $match_odds['kg_var'] = number_format($value_market['o'][0]['od'], 2);
            $match_odds['kg_yok'] = number_format($value_market['o'][1]['od'], 2);

            if ($value_market['o'][0]['od'] < $value_market['o'][0]['lodd']) {
                $match_odds['kg_var_cs'] = 2;
            } else {
                if ($value_market['o'][0]['lodd'] != $value_market['o'][0]['od']) $match_odds['kg_var_cs'] = 1;
            }

            if ($value_market['o'][1]['od'] < $value_market['o'][1]['lodd']) {
                $match_odds['kg_yok_cs'] = 2;
            } else {
                if ($value_market['o'][1]['lodd'] != $value_market['o'][1]['od']) $match_odds['kg_yok_cs'] = 1;
            }

        }

        if ($value_market['s'] == "1" && $value_market['st'] == "77") {
            $match_odds['ig_1'] = number_format($value_market['o'][0]['od'], 2);
            $match_odds['ig_x'] = number_format($value_market['o'][1]['od'], 2);
            $match_odds['ig_2'] = number_format($value_market['o'][2]['od'], 2);

            if ($value_market['o'][0]['od'] < $value_market['o'][0]['lodd']) {
                $match_odds['ig_1_cs'] = 2;
            } else {
                if ($value_market['o'][0]['lodd'] != $value_market['o'][0]['od']) $match_odds['ig_1_cs'] = 1;
            }

            if ($value_market['o'][1]['od'] < $value_market['o'][1]['lodd']) {
                $match_odds['ig_x_cs'] = 2;
            } else {
                if ($value_market['o'][1]['lodd'] != $value_market['o'][1]['od']) $match_odds['ig_x_cs'] = 1;
            }

            if ($value_market['o'][2]['od'] < $value_market['o'][2]['lodd']) {
                $match_odds['ig_2_cs'] = 2;
            } else {
                if ($value_market['o'][2]['lodd'] != $value_market['o'][2]['od']) $match_odds['ig_2_cs'] = 1;
            }
        }

        if ($value_market['s'] == "1" && $value_market['st'] == "4") {
            $match_odds['tg_1'] = number_format($value_market['o'][0]['od'], 2);
            $match_odds['tg_2'] = number_format($value_market['o'][1]['od'], 2);
            $match_odds['tg_3'] = number_format($value_market['o'][2]['od'], 2);
            $match_odds['tg_4'] = number_format($value_market['o'][3]['od'], 2);

            if ($value_market['o'][0]['od'] < $value_market['o'][0]['lodd']) {
                $match_odds['tg_1_cs'] = 2;
            } else {
                if ($value_market['o'][0]['lodd'] != $value_market['o'][0]['od']) $match_odds['tg_1_cs'] = 1;
            }

            if ($value_market['o'][1]['od'] < $value_market['o'][1]['lodd']) {
                $match_odds['tg_2_cs'] = 2;
            } else {
                if ($value_market['o'][0]['lodd'] != $value_market['o'][0]['od']) $match_odds['tg_2_cs'] = 1;
            }

            if ($value_market['o'][2]['od'] < $value_market['o'][2]['lodd']) {
                $match_odds['tg_3_cs'] = 2;
            } else {
                if ($value_market['o'][0]['lodd'] != $value_market['o'][0]['od']) $match_odds['tg_3_cs'] = 1;
            }

            if ($value_market['o'][3]['od'] < $value_market['o'][3]['lodd']) {
                $match_odds['tg_4_cs'] = 2;
            } else {
                if ($value_market['o'][0]['lodd'] != $value_market['o'][0]['od']) $match_odds['tg_4_cs'] = 1;
            }


        }

        if ($value_market['s'] == "1" && $value_market['st'] == "91") {
            $match_odds['tc_1'] = number_format($value_market['o'][0]['od'], 2);
            $match_odds['tc_2'] = number_format($value_market['o'][1]['od'], 2);

            if ($value_market['o'][0]['od'] < $value_market['o'][0]['lodd']) {
                $match_odds['tc_1_cs'] = 2;
            } else {
                if ($value_market['o'][0]['lodd'] != $value_market['o'][0]['od']) $match_odds['tc_1_cs'] = 1;
            }

            if ($value_market['o'][1]['od'] < $value_market['o'][1]['lodd']) {
                $match_odds['tc_2_cs'] = 2;
            } else {
                if ($value_market['o'][1]['lodd'] != $value_market['o'][1]['od']) $match_odds['tc_2_cs'] = 1;
            }
        }

    endforeach;
    // End single market values.

    if (empty($match_mbs)) $match_mbs = "1";
    $match_data[$match_time][$s]['lig'] = $match_lig;
    $match_data[$match_time][$s]['time'] = ($value['d'] / 1000);
    $match_data[$match_time][$s]['mbs'] = $match_mbs;
    $match_data[$match_time][$s]['name'] = $match_name;
    $match_data[$match_time][$s]['odds'] = $match_odds;
    $match_data[$match_time][$s]['market_value'] = $market_value['data']['m'];
    $match_data[$match_time][$s]['code'] = $match_code;
    $match_data[$match_time][$s]['total'] = $value['t'];


    $s++;
}

if ($s == 0) {
    echo 'end';
    exit();
}


?>
    <div id="matchListArea">
        <?php foreach ($match_data as $key2 => $data):
            $tarih_data[] = $key2;

            if (!empty($_GET['date'])) {
                $date = urldecode($_GET['date']);

                if ($key2 != $date) continue;
            }
            ?>
            <!-- Sticky Header -->
            <div class="sHeader headerS <?= permalink($key2) ?>">
                <!-- First Headline -->
                <?php if (!wp_is_mobile()): ?>
                    <div class="firstHeadline">
                        <ul>
                            <li class="tarih"><?= ($key2) ?></li>

                            <li class="ms">Maç Sonucu</li>
                            <li class="ilkGol">İlk Yarı Çifte Şans</li>
                            <li class="topGol">Toplam Gol</li>
                            <li class="tek-cift">Tek Çift</li>
                            <li class="AU">2,5 A/Ü</li>
                            <li class="karGol">Karş. Gol</li>

                        </ul>
                    </div>
                <?php endif; ?>
                <?php if (!wp_is_mobile()): ?>
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
                            <li class="bsi tCenter">1-X<i class="up"></i><i class="down"></i></li>
                            <li class="olmaz tCenter">1-2<i class="up"></i><i class="down"></i></li>
                            <li class="bsi tCenter bRightBlack">X-2<i class="up"></i><i class="down"></i></li>
                            <li class="bsi tCenter">0-1<i class="up"></i><i class="down"></i></li>
                            <li class="bsi tCenter">2-3<i class="up"></i><i class="down"></i></li>
                            <li class="bsi tCenter">4-5<i class="up"></i><i class="down"></i></li>
                            <li class="bsi tCenter bRightBlack">6+<i class="up"></i><i class="down"></i></li>
                            <li class="bsi tCenter">TEK<i class="up"></i><i class="down"></i></li>
                            <li class="bsi tCenter bRightBlack">ÇİFT<i class="up"></i><i class="down"></i></li>
                            <li class="bsi tCenter">ALT<i class="up"></i><i class="down"></i></li>
                            <li class="bsi tCenter bRightBlack">ÜST<i class="up"></i><i class="down"></i></li>
                            <li class="bsi tCenter">VAR<i class="up"></i><i class="down"></i></li>
                            <li class="bsi tCenter bRightBlack">YOK<i class="up"></i><i class="down"></i></li>
                        </ul>
                    </div>
                <?php endif; ?>

            </div>

            <!-- Matches -->
            <div class="nPMatches">
                <?php foreach ($match_data[$key2] as $key => $match_value):
                    if ($_GET['mbs'] != 0) {
                        if ($match_value['mbs'] != $_GET['mbs']) {
                            continue;
                        } else {
                            $match_search[$key2]['mbs'] = $match_search[$key2]['mbs'] + 1;
                        }

                    }

                    if (empty($match_value['name'])) {
                        continue;
                    }
                    ?>
                    <div class="nPMatch" data-name="<?= $match_value['name'] ?>" data-date="<?= $key2 ?>">
                        <ul class="fDatas">
                            <li class="lig tCenter"><?= mb_substr($match_value['lig'], 0, 5) ?></li>
                            <li class="saat tCenter"><?= date("H:i", $match_value['time']) ?></li>
                            <li class="mbs tCenter"><i
                                        class="<?= mbs_to_string($match_value['mbs']) ?>"><?= $match_value['mbs'] ?></i>
                            </li>
                            <li class="takimlar tLeft bRightBlack"><?= $match_value['name'] ?></li>
                            <li class="bsi tCenter <?= cs_status($match_value['odds']['ms_1_cs']) ?>">
                                <i></i><?= $match_value['odds']['ms_1'] ?></li>
                            <li class="bsi tCenter <?= cs_status($match_value['odds']['ms_x_cs']) ?>">
                                <i></i><?= $match_value['odds']['ms_x'] ?></li>
                            <li class="bsi tCenter bRightBlack <?= cs_status($match_value['odds']['ms_2_cs']) ?>">
                                <i></i><?= $match_value['odds']['ms_2'] ?></li>
                            <li class="bsi tCenter <?= cs_status($match_value['odds']['ig_1_cs']) ?>">
                                <i></i><?= $match_value['odds']['ig_1'] ?></li>
                            <li class="olmaz tCenter <?= cs_status($match_value['odds']['ig_x_cs']) ?>">
                                <i></i><?= $match_value['odds']['ig_x'] ?></li>
                            <li class="bsi tCenter bRightBlack <?= cs_status($match_value['odds']['ig_2_cs']) ?>">
                                <i></i><?= $match_value['odds']['ig_2'] ?></li>
                            <li class="bsi tCenter <?= cs_status($match_value['odds']['tg_1_cs']) ?>">
                                <i></i><?= $match_value['odds']['tg_1'] ?></li>
                            <li class="bsi tCenter <?= cs_status($match_value['odds']['tg_2_cs']) ?>">
                                <i></i><?= $match_value['odds']['tg_2'] ?></li>
                            <li class="bsi tCenter <?= cs_status($match_value['odds']['tg_3_cs']) ?>">
                                <i></i><?= $match_value['odds']['tg_3'] ?></li>
                            <li class="bsi tCenter bRightBlack <?= cs_status($match_value['odds']['tg_4_cs']) ?>">
                                <i></i><?= $match_value['odds']['tg_4'] ?></li>
                            <li class="bsi tCenter <?= cs_status($match_value['odds']['tc_1_cs']) ?>">
                                <i></i><?= $match_value['odds']['tc_1'] ?></li>
                            <li class="bsi tCenter bRightBlack <?= cs_status($match_value['odds']['tc_2_cs']) ?>">
                                <i></i><?= $match_value['odds']['tc_2'] ?></li>
                            <li class="bsi tCenter <?= cs_status($match_value['odds']['au_25_a_cs']) ?>">
                                <i></i><?= $match_value['odds']['au_25_a'] ?></li>
                            <li class="bsi tCenter bRightBlack <?= cs_status($match_value['odds']['au_25_u_cs']) ?>">
                                <i></i><?= $match_value['odds']['au_25_u'] ?></li>
                            <li class="bsi tCenter <?= cs_status($match_value['odds']['kg_var_cs']) ?>">
                                <i></i><?= $match_value['odds']['kg_var'] ?></li>
                            <li class="bsi tCenter bRightBlack <?= cs_status($match_value['odds']['kg_yok_cs']) ?>">
                                <i></i><?= $match_value['odds']['kg_yok'] ?></li>
                            <li class="plus"><a href="javascript:;"
                                                onclick="match_data(<?= $match_code[$key2][$key] ?>);"><i>+<?= $match_value['total'] ?></i></a>
                            </li>
                        </ul>
                        <div class="tumOranlar">

                            <div class="bas"><span>Tüm Oranlar</span><i class="close"></i></div>
                            <?php

                            foreach ($match_value['market_value'] as $key_odds_data_r => $value_odds_data_r):
                                $data_key = array(
                                    '604', '85', '72'
                                );

                                if (array_search($value_odds_data_r['st'], $data_key)) continue;
                                ?>
                                <div class="oranItem">
                                    <div class="text">
                                        <span><?= getMarketName($value_odds_data_r['s'] . "-" . $value_odds_data_r['st'] . "{}" . " " . $value_odds_data_r['ov']) ?></span>
                                    </div>
                                    <ul>
                                        <li class="mbs <?= mbs_to_string($value_odds_data_r['min']) ?>"><span>MBS</span><i><?= $value_odds_data_r['min'] ?></i>
                                        </li>
                                        <?php foreach ($value_odds_data_r['o'] as $key_odds_data => $value_odds_data): ?>
                                            <li>
                                                <span><?= $value_odds_data['n'] ?></span><i><?= $value_odds_data['od'] ?></i>
                                            </li>
                                        <?php endforeach; ?>
                                    </ul>
                                </div>

                            <?php endforeach; ?>

                        </div>

                        <!-- For Mobile -->
                        <div class="forMobileMatch" data-name="<?= $match_value['name'] ?>?>" data-date="<?= $key2 ?>">
                            <span class="matchTitle"><?= $match_value['name'] ?></span>
                            <ul class="frontInfos">
                                <li class="mbs <?= mbs_to_string($match_mbs[$key2][$key]) ?>"><i>3</i></li>
                                <li class="leauge"><?= mb_substr($match_value['lig'], 0, 5) ?></li>
                                <li class="time"><?= $match_hour[$key2][$key] ?></li>
                            </ul>
                            <ul class="oth">
                                <li class="code_<?= $match_code[$key2][$key] ?>_1">
                                    <span>1</span>
                                    <p><?= $match_value['odds']['ms_1'] ?></p></li>
                                <li class="code_<?= $match_code[$key2][$key] ?>_x">
                                    <span>0</span>
                                    <p><?= $match_value['odds']['ms_x'] ?></p></li>
                                <li class="code_<?= $match_code[$key2][$key] ?>_2">
                                    <span>2</span>
                                    <p><?= $match_value['odds']['ms_2'] ?></p></li>
                                <li class="othMore"><a
                                            href="/tum-oranlar?key=<?= $match_value['code'] ?>&type=football">+<?= $match_value['total'] ?></a>
                                </li>
                            </ul>
                        </div>

                    </div>
                <?php endforeach; ?>


            </div>

        <?php

        endforeach;
        foreach ($match_search as $key => $value) {
            if ($value == 0) {
                $showNotFound = false;
            } else {
                $showNotFound = true;
            }
        }
        foreach ($match_search as $key2 => $data):
            if ($_GET['lig'] != '0' || $_GET['date'] != '0' || $_GET['mbs'] != '0') {
                if (@$match_search[$key2]['date'] != 0 || $match_search[$key2]['lig'] != 0 || $match_search[$key2]['mbs'] != 0) {
                    if ($_GET['lig'] != '0' && $_GET['date'] != '0') {

                        if ($match_search[$key2]['lig'] == 0 || $match_search[$key2]['date'] == 0) {
                            ?>
                            <style>
                                .headerS<?=$key2?> {
                                    display: none;
                                }
                            </style>
                            <?php
                        }
                    }

                    if ($_GET['lig'] != '0' && $_GET['date'] != '0' && $_GET['mbs'] != '0') {
                        if ($match_search[$key2]['lig'] == 0 || $match_search[$key2]['mbs'] == 0 || $match_search[$key2]['date'] == 0) {
                            ?>
                            <style>
                                .headerS<?=$key2?> {
                                    display: none;
                                }
                            </style>
                            <?php
                        }
                    }

                    if ($_GET['mbs'] != '0' && $_GET['date'] != '0') {
                        if ($match_search[$key2]['date'] == 0 || $match_search[$key2]['mbs'] == 0) {
                            ?>
                            <style>
                                .headerS<?=$key2?> {
                                    display: none;
                                }
                            </style>
                            <?php
                        }
                    }

                    if ($_GET['lig'] != '0' && $_GET['mbs'] != '0') {
                        if ($match_search[$key2]['lig'] == 0 || $match_search[$key2]['date'] == 0) {
                            ?>
                            <style>
                                .headerS<?=$key2?> {
                                    display: none;
                                }
                            </style>
                            <?php
                        }
                    }

                    ?>
                    <style>
                        .headerS<?=$key2?> {
                            display: none;
                        }
                    </style>
                    <?php
                } else {
                    ?>
                    <style>
                        .headerS<?=$key2?> {
                            display: none;
                        }
                    </style>
                    <?php
                }
            }
        endforeach;

        if ($showNotFound == true) {
            ?><p></p><?php
        }
        ?>
    </div>

    <div class="tarihData" style="display: none"><?php
        foreach (array_unique($tarih_data) as $key5 => $tarih) {
            ?>
            <li onclick="changeDate('<?= $tarih ?>')"><p><?= $tarih ?></p></li>
            <?php

        }

        ?>
    </div>
<?php
if (empty($_GET['start'])) {
    ?>
    <script>
        document.addEventListener("click", closeAllSelect);

        $(document).ready(function () {
            $(".nPMatch .tumOranlar").hide();
            $("ul.fDatas li.plus").click(function () {
                $(".nPMatch .tumOranlar").hide();

                var oranlar_status = $(this).parents('ul').parents('.nPMatch').find(".tumOranlar").is(":visible");

                if (oranlar_status == true) {
                    $(this).parents('ul').parents('.nPMatch').find(".tumOranlar").hide();
                } else {
                    $(this).parents('ul').parents('.nPMatch').find(".tumOranlar").show();
                }
            });
            $(".nPMatch .tumOranlar .bas i.close").click(function () {
                $(this).parents('div.tumOranlar').hide();
            });
        });


    </script>
    <?php
}

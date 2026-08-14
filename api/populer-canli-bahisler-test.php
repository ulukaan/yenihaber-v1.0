<?php
include 'api_helper.php';
//$misliKaynak = json_decode(misli_curl("https://apivx.misli.com/api/web/v1/sportsbook/popular-events"), true);
if(!function_exists("wp_is_mobile")){
    function wp_is_mobile() {
        if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
            $is_mobile = false;
        } elseif ( strpos( $_SERVER['HTTP_USER_AGENT'], 'Mobile' ) !== false // many mobile devices (all iPhone, iPad, etc.)
            || strpos( $_SERVER['HTTP_USER_AGENT'], 'Android' ) !== false
            || strpos( $_SERVER['HTTP_USER_AGENT'], 'Silk/' ) !== false
            || strpos( $_SERVER['HTTP_USER_AGENT'], 'Kindle' ) !== false
            || strpos( $_SERVER['HTTP_USER_AGENT'], 'BlackBerry' ) !== false
            || strpos( $_SERVER['HTTP_USER_AGENT'], 'Opera Mini' ) !== false
            || strpos( $_SERVER['HTTP_USER_AGENT'], 'Opera Mobi' ) !== false ) {
            $is_mobile = true;
        } else {
            $is_mobile = false;
        }
    }
}
$misliKaynak = json_decode( misli_popular('https://apivx.misli.com/api/web/v1/sportsbook/popular-events'), true );

?><div class="items"><?php
    $num = 0;
    $list_json = $misliKaynak['data']['e'];
    foreach ($list_json as $key => $value) {
        if ($value['st'] != "SOCCER") continue;

        $teamName[1][0] = $value['ph'] . " - " . $value['pa'];

        $hour = ($value['d'] / 1000) + (3600 * 3);
        $tomorrow = (int) date("d") + 1;

        if (date("d", $hour) == date("d")) {
            $away_date = "BUGÜN";
        } else if( $tomorrow == date("d", $hour) ) {
            $away_date = "YARIN";
        }else{
            continue;
        }

        $time = time() - $hour;
        $list_json_clean[$hour] = $value;

    }

    ksort($list_json_clean);

    foreach ($list_json_clean as $key=>$value) {
        if ($value['st'] != "SOCCER") continue;
        $teamName[1][0] = $value['ph'] . " - " . $value['pa'];

        $hour = ($value['d'] / 1000) + (3600 * 3);

        $tomorrow = (int) date("d") + 1;
        if (date("d", $hour) == date("d")) {
            $away_date = "BUGÜN";
        } else if( $tomorrow == date("d", $hour) ) {
            $away_date = "YARIN";
        }

        $time = time() - $hour;
        ?>

        <div class="item">
            <div class="teams">
                <i><img src="<?=$value['phi']?>" width="34" height="36" alt="" /></i>
                <i><img src="<?=$value['pai']?>" width="34" height="36" alt="" /></i>
                <?php if($time > 0): ?>
                    <div class="right"><span>‘<?=$time?>.dk</span><b><?=$period?></b></div>
                <?php endif; ?>
            </div>
            <ul class="ort">
                <li><span><?=$value['ph']?></span>
                    <?php if($time > 0): ?>
                        <b class="score"><?=$sportRadar['doc'][0]['data']['match']['result']['home']?></b>
                    <?php else:
                        ?><b class="cl"><?=date("H:i", $hour)?></b><?php
                    endif; ?>
                </li>

                <li><span><?=$value['pa']?></span>
                    <?php if($time > 0): ?>
                        <b class="score"><?=$sportRadar['doc'][0]['data']['match']['result']['away']?></b>
                    <?php else:
                        ?><b class="date"><?=$away_date?></b><?php
                    endif; ?>
                </li>

            </ul>
        </div>
    <?php } ?>
</div>

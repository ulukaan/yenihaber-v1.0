<?php
include 'api/api_helper.php';
$kaynak = get_url_curl("https://finans.mynet.com/doviz/");

preg_match_all('@<tbody class="tbody-type-default">(.*?)</tbody>@si', $kaynak, $table);

preg_match_all('@<td><strong><a href="https://finans.mynet.com/parite/(.*?)/" title="(.*?)">(.*?)</a></strong></td>@si', $table[1][1], $parite);
preg_match_all('@<tr>(.*?)</tr>@si', $table[1][1], $parite_value);

foreach($parite[1] as $key=>$value):
    preg_match_all('@<td class="text-center">(.*?)</td>@si', $parite_value[1][$key], $value_data);

    $code = $parite[1][$key];
    $parite_data['code'][$code] = $code;
    $parite_data['full_name'][$code] = $parite[2][$key];
    $parite_data['buying'][$code] = $value_data[1][2];
    $parite_data['selling'][$code] = $value_data[1][3];
    $parite_data['change_rate'][$code] = $value_data[1][4];
    $parite_data['time'][$code] = $value_data[1][5];

endforeach;
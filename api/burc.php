<?php
include 'api_helper.php';
global $return_burc_data;
$burc = $_GET['burc'];
if ($burc) {
    $kaynak = get_url_curl_burc("https://www.gunlukburc.net/gunluk-burc-yorumlari/" . $burc . ".html");

    preg_match_all('@<h2 class="desc" itemprop="description">(.*?)</h2>@si', $kaynak, $desc);
    preg_match_all('@<div xclass="d-flex">(.*?)<style>@si', $kaynak, $content);
    preg_match_all('@class="percentage">(.*?)</text>@si', $kaynak, $percentage);
    preg_match_all('@<div class="py-2">(.*?)</div>@si', $kaynak, $son_guncelleme);
    preg_match_all('@<div class=\'col-4 col-lg-4 py-1\'>(.*?)</div><@si', $kaynak, $gezegen_location);
    preg_match_all('@<div class=\'col-2 col-lg-2 py-1\'><strong>(.*?)</strong></div>@si', $kaynak, $names);
}

$return_burc_data['desc']        = strip_tags($desc[1][0]);
$return_burc_data['name']        = explode(" ", $return_burc_data['desc'])[0];

preg_match_all('@<script(.*?)>(.*?)</script>@si', $content[1][0], $remove_script);
preg_match_all('@<style(.*?)>(.*?)</style>@si', $content[1][0], $remove_style);

$content[1][0]     = str_replace($remove_script[0], '', $content[1][0]);
$content[1][0]     = str_replace($remove_style[0], '', $content[1][0]);

$return_burc_data['content']     = strip_tags($content[1][0], "<p><h2><h3><h4><h5><h6><b><strong>");
$return_burc_data['percentage']  = $percentage[1];
$return_burc_data['guncelleme']  = $son_guncelleme[1][0];
$return_burc_data['location']    = $gezegen_location[1];
$return_burc_data['names']    = $names[1];

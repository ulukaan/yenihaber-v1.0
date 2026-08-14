<?php
include 'api_helper.php';

$kaynak = get_url_curl("https://www.eczaneler.gen.tr/nobetci-istanbul");

preg_match_all('@<div class="d-flex alert alert-warning text-center rounded shadow-sm">(.*?)</table>@si', $kaynak, $eczane_area);

print_r($eczane_area);
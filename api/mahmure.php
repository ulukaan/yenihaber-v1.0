<?php
include 'api_helper.php';

$mahmure = get_url_curl("https://www.hurriyet.com.tr/mahmure/astroloji/$burc/");



preg_match_all('@class="horoscope-menu-subtitle">(.*?)</h3>@si', $mahmure, $tarih);
preg_match_all('@<li class="horoscope-menu-list-item">(.*?)</li>@si', $mahmure, $spec);
preg_match_all('@<div class="horoscope-detail-tab-content">(.*?)</div>@si', $mahmure, $detail);
preg_match_all('@<a href="/mahmure/astroloji/burclar/(.*?)/" class="horoscope-detail-tag ">(.*?)</a>@si', $mahmure, $tag);
preg_match_all('@<h2 class="horoscope-menu-title">(.*?)</h2>@si', $mahmure, $burc_name);

$burc_name[1][0] = str_replace("burcu","Burcu",ucfirst(mb_strtolower(html_entity_decode($burc_name[1][0]), "UTF-8")));
preg_match_all('@<section(.*?)>(.*?)</section>@si', $detail[1][0], $remove_sec);
preg_match_all('@<script(.*?)>(.*?)</script>@si', $detail[1][0], $remove_script);
preg_match_all('@<style(.*?)>(.*?)</style>@si', $detail[1][0], $style);

$detail[1][0] = strip_tags(
    str_replace($style[0], null,
        str_replace($remove_script[0], null,
            str_replace(array($remove_sec[0]), null, $detail[1][0])
        )
    ),
    "<h2><h3><h4><h5><h6><strong><b><br />");

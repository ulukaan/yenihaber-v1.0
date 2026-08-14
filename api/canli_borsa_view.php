<?php
if(!empty($_GET['Endex'])){
    $uzmanpara = get_url_curl("https://uzmanpara.milliyet.com.tr/canli-borsa/".$_GET['Endex']."-hisseleri/");
}else{
    $uzmanpara = get_url_curl("https://uzmanpara.milliyet.com.tr/canli-borsa/");
}

preg_match_all('@<table cellspacing="0" cellpadding="0" border="0" class="table3">(.*?)</table>@si', $uzmanpara, $table_data);
preg_match_all('@<tr class="zebra" id="h_tr_id_(.*?)" >(.*?)</tr>@si', $table_data[1][0], $data_table1);
preg_match_all('@<tr class="zebra" id="h_tr_id_(.*?)" >(.*?)</tr>@si', $table_data[1][1], $data_table2);
preg_match_all('@<tr class="zebra" id="h_tr_id_(.*?)" >(.*?)</tr>@si', $table_data[1][2], $data_table3);
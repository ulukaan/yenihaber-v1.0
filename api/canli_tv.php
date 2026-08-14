<?php
include 'api_helper.php';
if(!lisans_ekstra()){
    die();
}
$kanal_data = get_data_service('tvyayin');
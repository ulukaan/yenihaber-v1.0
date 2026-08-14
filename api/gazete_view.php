<?php
header('Content-type: image/jpeg');
echo file_get_contents("https://gazete.bik.gov.tr/first_pages/".$_GET['image']);
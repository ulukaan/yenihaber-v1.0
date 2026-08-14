<?php
include 'api_helper.php';
if(!class_exists('DataCache')) {
	include 'DataCache.php';
}

$DataCache = new DataCache(30);

$date = $_GET['date'] ?? '';

switch ($date):
    case 'dun':
        $current_day = date("d");
        $yesterday   = $current_day-1; // Get Yestarday

        $current_date = $yesterday." ".date("Y-m-d");
        $kaynak_url = "https://www.gazeteoku.com/gazeteler?date=".permalink($current_date);

        break;

    default:
        $current_date = date_i18n("Y-m-d", strtotime($date));
        $kaynak_url = "https://www.gazeteoku.com/gazeteler?date=".permalink($current_date);
        break;
endswitch;

if (empty($date)) {
	$kaynak_url = "https://www.gazeteoku.com/gazeteler";
	if ($DataCache->get('gazete.html')) {
		$kaynak = $DataCache->get('gazete.html');
	} else {
		$kaynak = get_data_service_gazete( 'gazete/?url=' . $kaynak_url );
		$DataCache->write('gazete.html', $kaynak);
	}
} else {
	$kaynak = get_data_service_gazete( 'gazete/?url=' . $kaynak_url );

}

preg_match_all('@data-src="(.*?)" data-srcset@si', $kaynak, $gazeteler);
preg_match_all('@<strong>(.*?)</strong>@si', $kaynak, $gazete_name);
preg_match_all('@<small>(.*?)</small>@si', $kaynak, $gazete_date);
if(empty($gazeteler[1][0])) {
    $kaynak = get_data_service_gazete( 'gazete/?url=' . $kaynak_url );
    preg_match_all('@data-src="(.*?)" data-srcset@si', $kaynak, $gazeteler);
    preg_match_all('@<strong>(.*?)</strong>@si', $kaynak, $gazete_name);
    preg_match_all('@<small>(.*?)</small>@si', $kaynak, $gazete_date);
}

foreach( $gazeteler[1] as $key_new=>$new_value ){
    if( $key_new > 28 ){
        unset($gazeteler[1][$key_new]);
        unset($gazeteler[0][$key_new]);
    }
}

foreach ($gazeteler[1] as $key => $value) {
    $gazete_detail[html_entity_decode($gazete_name[1][$key])] = $key;
    $gazete_url[html_entity_decode($gazete_name[1][$key])] = $value;
}

if( !empty( $_GET['yerel'] ?? '' ) ) {
    $str = '<option value="10">ADANA</option>
<option value="11">ADIYAMAN</option>
<option value="12">AFYONKARAHİSAR</option>
<option value="13">AĞRI</option>
<option selected="selected" value="14">AKSARAY</option>
<option value="15">AMASYA</option>
<option value="16">ANKARA</option>
<option value="17">ANTALYA</option>
<option value="18">ARDAHAN</option>
<option value="19">ARTVİN</option>
<option value="20">AYDIN</option>
<option value="21">BALIKESİR</option>
<option value="22">BARTIN</option>
<option value="23">BATMAN</option>
<option value="24">BAYBURT</option>
<option value="25">BİLECİK</option>
<option value="26">BİNGÖL</option>
<option value="27">BİTLİS</option>
<option value="28">BOLU</option>
<option value="29">BURDUR</option>
<option value="30">BURSA</option>
<option value="31">ÇANAKKALE</option>
<option value="32">ÇANKIRI</option>
<option value="33">ÇORUM</option>
<option value="34">DENİZLİ</option>
<option value="35">DİYARBAKIR</option>
<option value="36">DÜZCE</option>
<option value="37">EDİRNE</option>
<option value="38">ELAZIĞ</option>
<option value="39">ERZİNCAN</option>
<option value="40">ERZURUM</option>
<option value="41">ESKİŞEHİR</option>
<option value="42">GAZİANTEP</option>
<option value="43">GİRESUN</option>
<option value="44">GÜMÜŞHANE</option>
<option value="45">HAKKARİ</option>
<option value="46">HATAY</option>
<option value="47">IĞDIR</option>
<option value="48">ISPARTA</option>
<option value="49">İSTANBUL</option>
<option value="50">İZMİR</option>
<option value="51">KAHRAMANMARAŞ</option>
<option value="52">KARABÜK</option>
<option value="53">KARAMAN</option>
<option value="54">KARS</option>
<option value="55">KASTAMONU</option>
<option value="56">KAYSERİ</option>
<option value="58">KIRIKKALE</option>
<option value="59">KIRKLARELİ</option>
<option value="60">KIRŞEHİR</option>
<option value="57">KİLİS</option>
<option value="61">KOCAELİ</option>
<option value="62">KONYA</option>
<option value="63">KÜTAHYA</option>
<option value="64">MALATYA</option>
<option value="65">MANİSA</option>
<option value="66">MARDİN</option>
<option value="67">MERSİN</option>
<option value="68">MUĞLA</option>
<option value="69">MUŞ</option>
<option value="70">NEVŞEHİR</option>
<option value="71">NİĞDE</option>
<option value="72">ORDU</option>
<option value="73">OSMANİYE</option>
<option value="74">RİZE</option>
<option value="75">SAKARYA</option>
<option value="76">SAMSUN</option>
<option value="78">SİİRT</option>
<option value="79">SİNOP</option>
<option value="81">SİVAS</option>
<option value="77">ŞANLIURFA</option>
<option value="80">ŞIRNAK</option>
<option value="82">TEKİRDAĞ</option>
<option value="83">TOKAT</option>
<option value="84">TRABZON</option>
<option value="85">TUNCELİ</option>
<option value="86">UŞAK</option>
<option value="87">VAN</option>
<option value="88">YALOVA</option>
<option value="89">YOZGAT</option>
<option value="90">ZONGULDAK</option>';
    preg_match_all('@<option value="(.*?)">(.*?)</option>@si', $str, $sehirList);
    foreach ($sehirList[1] as $key2=>$data2) :
        $sehirCleanList[$sehirList[2][$key2]] = $sehirList[1][$key2];
    endforeach;
    $_GET['yerel'] = str_replace("i","İ",$_GET['yerel']);

    $kaynak = get_url_curl("https://gazete.bik.gov.tr/Uygulamalar/GazeteIlkSayfalar?kapsam=yerel&il=" . $sehirCleanList[mb_strtoupper($_GET['yerel'], "UTF-8")]);

    preg_match_all('@<div class="figcaption" itemprop="caption description">                            <a href=""><span>(.*?)</span></a>                        </div>@si', $kaynak, $name_list);
    preg_match_all('@class="newspaper-list-item">                            <img src="(.*?)" itemprop="thumbnail" class="img-responsive"@si', $kaynak, $img_list);

    unset($gazete_url);
    foreach( $img_list[1] as $key=>$value ) {
        $gazete_url[permalink(html_entity_decode($name_list[1][$key]))] = explode("?v=",str_replace(array("_thumb","/thumb"),'',$value))[0];
    }



}

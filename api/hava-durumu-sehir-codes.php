<?php


if (!function_exists('hava_durumu_sehir_codes')) {
	function hava_durumu_sehir_codes()
	{
		$sehirler = array();
		$html = '<ul class="city-list">
<li><a href="adana" title="Adana">Adana</a></li>
<li><a href="adiyaman" title="Adıyaman">Adıyaman</a></li>
<li><a href="afyon" title="Afyon">Afyon</a></li>
<li><a href="agri" title="Ağrı">Ağrı</a></li>
<li><a href="aksaray" title="Aksaray">Aksaray</a></li>
<li><a href="amasya" title="Amasya">Amasya</a></li>
<li><a href="ankara" title="Ankara">Ankara</a></li>
<li><a href="antalya" title="Antalya">Antalya</a></li>
<li><a href="ardahan" title="Ardahan">Ardahan</a></li>
<li><a href="artvin" title="Artvin">Artvin</a></li>
<li><a href="aydin" title="Aydın">Aydın</a></li>
<li><a href="balikesir" title="Balıkesir">Balıkesir</a></li>
<li><a href="bartin" title="Bartın">Bartın</a></li>
<li><a href="batman" title="Batman">Batman</a></li>
<li><a href="bayburt" title="Bayburt">Bayburt</a></li>
<li><a href="bilecik" title="Bilecik">Bilecik</a></li>
<li><a href="bingol" title="Bingöl">Bingöl</a></li>
<li><a href="bitlis" title="Bitlis">Bitlis</a></li>
<li><a href="bolu" title="Bolu">Bolu</a></li>
<li><a href="burdur" title="Burdur">Burdur</a></li>
<li><a href="bursa" title="Bursa">Bursa</a></li>
<li><a href="canakkale" title="Çanakkale">Çanakkale</a></li>
<li><a href="cankiri" title="Çankırı">Çankırı</a></li>
<li><a href="corum" title="Çorum">Çorum</a></li>
<li><a href="denizli" title="Denizli">Denizli</a></li>
<li><a href="diyarbakir" title="Diyarbakır">Diyarbakır</a></li>
<li><a href="duzce" title="Düzce">Düzce</a></li>
<li><a href="edirne" title="Edirne">Edirne</a></li>
<li><a href="elazig" title="Elazığ">Elazığ</a></li>
<li><a href="erzincan" title="Erzincan">Erzincan</a></li>
<li><a href="erzurum" title="Erzurum">Erzurum</a></li>
<li><a href="eskisehir" title="Eskişehir">Eskişehir</a></li>
<li><a href="gaziantep" title="Gaziantep">Gaziantep</a></li>
<li><a href="giresun" title="Giresun">Giresun</a></li>
<li><a href="gumushane" title="Gümüşhane">Gümüşhane</a></li>
<li><a href="hakkari" title="Hakkari">Hakkari</a></li>
<li><a href="hatay" title="Hatay">Hatay</a></li>
<li><a href="igdir" title="Iğdır">Iğdır</a></li>
<li><a href="isparta" title="Isparta">Isparta</a></li>
<li><a href="istanbul" title="İstanbul">İstanbul</a></li>
<li><a href="izmir" title="İzmir">İzmir</a></li>
<li><a href="kahramanmaras" title="Kahramanmaraş">Kahramanmaraş</a></li>
<li><a href="karabuk" title="Karabük">Karabük</a></li>
<li><a href="karaman" title="Karaman">Karaman</a></li>
<li><a href="kars" title="Kars">Kars</a></li>
<li><a href="kastamonu" title="Kastamonu">Kastamonu</a></li>
<li><a href="kayseri" title="Kayseri">Kayseri</a></li>
<li><a href="kilis" title="Kilis">Kilis</a></li>
<li><a href="kirikkale" title="Kırıkkale">Kırıkkale</a></li>
<li><a href="kirklareli" title="Kırklareli">Kırklareli</a></li>
<li><a href="kirsehir" title="Kırşehir">Kırşehir</a></li>
<li><a href="kocaeli" title="Kocaeli">Kocaeli</a></li>
<li><a href="konya" title="Konya">Konya</a></li>
<li><a href="kutahya" title="Kütahya">Kütahya</a></li>
<li><a href="malatya" title="Malatya">Malatya</a></li>
<li><a href="manisa" title="Manisa">Manisa</a></li>
<li><a href="mardin" title="Mardin">Mardin</a></li>
<li><a href="mersin" title="Mersin">Mersin</a></li>
<li><a href="mugla" title="Muğla">Muğla</a></li>
<li><a href="mus" title="Muş">Muş</a></li>
<li><a href="nevsehir" title="Nevşehir">Nevşehir</a></li>
<li><a href="nigde" title="Niğde">Niğde</a></li>
<li><a href="ordu" title="Ordu">Ordu</a></li>
<li><a href="osmaniye" title="Osmaniye">Osmaniye</a></li>
<li><a href="rize" title="Rize">Rize</a></li>
<li><a href="sakarya" title="Sakarya">Sakarya</a></li>
<li><a href="samsun" title="Samsun">Samsun</a></li>
<li><a href="sanliurfa" title="Şanlıurfa">Şanlıurfa</a></li>
<li><a href="siirt" title="Siirt">Siirt</a></li>
<li><a href="sinop" title="Sinop">Sinop</a></li>
<li><a href="sirnak" title="Şırnak">Şırnak</a></li>
<li><a href="sivas" title="Sivas">Sivas</a></li>
<li><a href="tekirdag" title="Tekirdağ">Tekirdağ</a></li>
<li><a href="tokat" title="Tokat">Tokat</a></li>
<li><a href="trabzon" title="Trabzon">Trabzon</a></li>
<li><a href="tunceli" title="Tunceli">Tunceli</a></li>
<li><a href="usak" title="Uşak">Uşak</a></li>
<li><a href="van" title="Van">Van</a></li>
<li><a href="yalova" title="Yalova">Yalova</a></li>
<li><a href="yozgat" title="Yozgat">Yozgat</a></li>
<li><a href="zonguldak" title="Zonguldak">Zonguldak</a></li></ul>';
		
		preg_match_all('@<li><a href="(.*?)/(.*?)" title="(.*?)">(.*?)</a></li>@si', $html, $codes);
		
		foreach ($codes[1] as $key => $value) {
			$code_list[$value] = $codes[2][$key];
		}
		
		return $code_list;
	}
}

<?php
if (!function_exists('lisans_ekstra')) {
    function lisans_ekstra()
    {
        global $lisans_ekstra;
        // Plugin dosyası kaldırıldı - güvenlik nedeniyle
        // include "./../../../plugins/birhaber-ekstra/lisans_ekstra.php";

        $domain = $_SERVER["HTTP_HOST"];
        $domain = str_replace('www.', '', $domain);
        $random = 'D6eQHEfeqwe_CDFE63sej';
        $h = '' . $random . '_' . $domain . '';


        $hash = md5($h);


        // Lisans kontrolü devre dışı - güvenlik nedeniyle
        return true;
    }
}

if (!function_exists('get_data_service')) {
    function get_data_service($parameter, $parameter_post = "")
    {
        // Lisans dosyası kaldırıldı - güvenlik nedeniyle
        // include __DIR__ . "/../lisans.php";

        $domain = $_SERVER["HTTP_HOST"];
        $domain = str_replace('www.', '', $domain);

        $curl = curl_init("https://data.birtema.com/data/" . $parameter);
        curl_setopt($curl, CURLOPT_TIMEOUT, 5);
        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $source = "lisans=demo&domain=" . $domain . $parameter_post);
        curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.122 Safari/534.30");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);

        if ($parameter_post) {
            return $curlResult;
        }
        return json_decode($curlResult, true);
    }
}


if (!function_exists('get_data_service_gazete')) {
    function get_data_service_gazete($parameter)
    {
        $curl = curl_init("https://data.birtema.com/data/" . $parameter);
        curl_setopt($curl, CURLOPT_TIMEOUT, 5);
        curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.122 Safari/534.30");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);

        return $curlResult;
    }
}

if (!function_exists("get_url_curl_burc")) {
    function get_url_curl_burc($url, $remove_array = array("\n", "\t", "\r"))
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.122 Safari/534.30");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return str_replace($remove_array, '', $curlResult);
    }
}
if (!function_exists("get_url_curl")) {
    function get_url_curl($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.122 Safari/534.30");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return str_replace(array("\n", "\t", "\r"), '', $curlResult);
    }
}
if (!function_exists("get_bigpara")) {
    function get_bigpara($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.122 Safari/534.30");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", 'Host: bigpara.hurriyet.com.tr
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:75.0) Gecko/20100101 Firefox/75.0
Accept: */*
Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate
VerificationToken: rZ9CAfZuIco1aYGHq3w6y0wULH0UlA1wL_j-fHnJcsvZYeqPhbcnUzyw8cf7dX07qe8ur_FUDVqy6qp7A8P_7A1Mx_M1,xmqTRCII3QhYwUH0D0HlNEXQatUbnHrWsLQySToN5tHWcmuvr9SZamMn5OsX2ZDJH-aIb0fGrbadHJnd131WlcXHAUo1
X-Requested-With: XMLHttpRequest
Connection: keep-alive
Referer: https://bigpara.hurriyet.com.tr/altin/yarim-altin-fiyati/3yil/
Cache-Control: max-age=0'));


        $curlResult = curl_exec($curl);
        curl_close($curl);
        return str_replace(array("\n", "\t", "\r"), '', $curlResult);
    }
}


if (!function_exists("get_url_curl_gazete")) {
    function get_url_curl_gazete($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "1");
        //curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.122 Safari/534.30");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        //curl_setopt($curl, CURLOPT_ENCODING, 'utf-8');
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", 'GET /gazeteler HTTP/3
Host: www.gazeteoku.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Alt-Used: www.gazeteoku.com
Connection: keep-alive'));

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return str_replace(array("\n", "\t", "\r"), '', $curlResult);
    }
}

if (!function_exists("get_url_banka")) {
    function get_url_banka($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.122 Safari/534.30");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", "Host: kur.doviz.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:67.0) Gecko/20100101 Firefox/67.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate, br
Referer: https://kur.doviz.com/sekerbank/amerikan-dolari
Connection: keep-alive
Cookie: cookie-disclaimer=1; _ga=GA1.2.543312151.1555535187; __gfp_64b=2cgqS7CZ4axJCxtq3UmlGUv1tf4YBw3s41ne7k9HKBX.N7; __gads=ID=ec306235f60c7038:T=1555535190:S=ALNI_MY4i0KiBrjZNZvgkj1LvJ5qwOLqsw; cto_lwid=4fbc0281-8dd0-4d61-beb6-c09d04f39b42; cto_idcpy=c5e8606e-717c-4922-81b7-b4aa4775b302
Upgrade-Insecure-Requests: 1
Pragma: no-cache
Cache-Control: no-cache
TE: Trailers"));

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return str_replace(array("\n", "\t", "\r"), '', $curlResult);
    }
}
if (!function_exists("permalink")) {
    function permalink($str, $options = array())
    {
        $defaults = [
            'delimiter' => '-', // Kelimeleri ayırmak için kullanılan karakter
            'lowercase' => true // Küçük harfe çevirme seçeneği
        ];

        $options = array_merge($defaults, $options);

        // Türkçe karakter haritası
        $char_map = [
            'Ş' => 'S',
            'İ' => 'I',
            'Ç' => 'C',
            'Ü' => 'U',
            'Ö' => 'O',
            'Ğ' => 'G',
            'ş' => 's',
            'ı' => 'i',
            'ç' => 'c',
            'ü' => 'u',
            'ö' => 'o',
            'ğ' => 'g'
        ];

        // Türkçe karakterleri dönüştür
        $str = str_replace(array_keys($char_map), $char_map, $str);

        // Türkçe olmayan karakterleri ve fazla boşlukları temizle
        $str = preg_replace('/[^a-zA-Z0-9\s]/u', '', $str); // Sadece harf, rakam ve boşluk bırak
        $str = preg_replace('/\s+/', $options['delimiter'], $str); // Boşlukları ayırıcıyla değiştir

        // Belirtilmişse küçük harfe çevir
        if ($options['lowercase']) {
            $str = mb_strtolower($str, 'UTF-8');
        }

        // Sonunda kalan ayırıcıları temizle
        $str = trim($str, $options['delimiter']);

        return $str;
    }
}

if (!function_exists("ntv_spor")) {
    function ntv_spor()
    {
        $content = '{"coverageId":"ab1450da-9d77-479c-8ab7-f46b2533b2dc","options":{"lang":"tr-TR","betCode":true,"sportId":1,"origin":"ntvspor.net","timeZone":3}}';
        $curl = curl_init("https://brdg-d2d66d21-7796-4d6c-a6d5-7fee80f9d915.azureedge.net/livescore/matchlist");
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $content);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", "Host: brdg-d2d66d21-7796-4d6c-a6d5-7fee80f9d915.azureedge.net
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:70.0) Gecko/20100101 Firefox/70.0
Accept: */*
Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate, br
Referer: https://www.ntvspor.net/canli-skorlar
Content-Type: application/json
Origin: https://www.ntvspor.net
Content-Length: 143
Connection: keep-alive
Pragma: no-cache
Cache-Control: no-cache
TE: Trailers"));

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return $curlResult;
    }
}


if (!function_exists("get_sahadan_data")) :
    function get_sahadan_data($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", "Host: api.performfeeds.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:70.0) Gecko/20100101 Firefox/70.0
Accept: */*
Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Referer: https://www.sahadan.com/mac/lamia-vs-panaitolikos/karsilastirma/edzbuv68669fiar77pbcyx3l6
Pragma: no-cache
Cache-Control: no-cache"));

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return $curlResult;
    }
endif;

if (!function_exists("misli_curl")) :
    function misli_curl($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", "Host: www.misli.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:70.0) Gecko/20100101 Firefox/70.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Cookie: _pk_id.718.d9b3=e7baf62bda74dd1d.1569941775.3.1570876473.1570875458.; _fbp=fb.1.1569941776564.751091627; _ga=GA1.2.225670636.1569941778; ASP.NET_SessionId=rcilxltbll5ctypfs5laziky; BIGipServerML-Web-Prod=369164298.20480.0000; VLCV1OK=1; OfferMiner_ID=NKFBPGHEJXXLQHFD20191012014013; _gid=GA1.2.1858073997.1570833614; _pk_ses.718.d9b3=1; VL_CM_0=%7B%22Items%22%3A%5B%7B%22K%22%3A%22VL_LastPageViewTime%22%2C%22V%22%3A%222019-10-12%252013%253A34%253A32%22%2C%22E%22%3A%222021-10-01%2013%3A34%3A32%22%7D%2C%7B%22K%22%3A%22VL_TotalDuration%22%2C%22V%22%3A%221069%22%2C%22E%22%3A%222021-10-01%2013%3A34%3A32%22%7D%2C%7B%22K%22%3A%22VL_FirstVisitTime%22%2C%22V%22%3A%222019-10-12%252001%253A40%253A13%22%2C%22E%22%3A%222021-10-01%2001%3A40%3A13%22%7D%2C%7B%22K%22%3A%22VL_TotalPV%22%2C%22V%22%3A%2213%22%2C%22E%22%3A%222021-10-01%2013%3A34%3A32%22%7D%2C%7B%22K%22%3A%22VL_TotalVisit%22%2C%22V%22%3A%222%22%2C%22E%22%3A%222021-10-01%2013%3A17%3A37%22%7D%2C%7B%22K%22%3A%22OfferMiner_ID%22%2C%22V%22%3A%22NKFBPGHEJXXLQHFD20191012014013%22%2C%22E%22%3A%222021-10-01%2001%3A40%3A13%22%7D%2C%7B%22K%22%3A%22OM_INW%22%2C%22V%22%3A%221%22%2C%22E%22%3A%222021-10-01%2001%3A40%3A13%22%7D%2C%7B%22K%22%3A%22VLTVisitorC%22%2C%22V%22%3A%22%257B%2522data%2522%253A%257B%257D%257D%22%2C%22E%22%3A%222021-10-01%2013%3A34%3A33%22%7D%2C%7B%22K%22%3A%22OM_rDomain%22%2C%22V%22%3A%22https%253A%252F%252Fwww.misli.com%252F%22%2C%22E%22%3A%222021-10-01%2013%3A25%3A41%22%7D%2C%7B%22K%22%3A%22VL_LastPVTimeForTD%22%2C%22V%22%3A%222019-10-12%252013%253A34%253A32%22%2C%22E%22%3A%222019-10-12%2014%3A04%3A32%22%7D%2C%7B%22K%22%3A%22VL_PVCountInVisit%22%2C%22V%22%3A%2210%22%2C%22E%22%3A%222019-10-12%2014%3A04%3A32%22%7D%2C%7B%22K%22%3A%22VL_VisitStartTime%22%2C%22V%22%3A%222019-10-12%252013%253A17%253A37%22%2C%22E%22%3A%222019-10-12%2013%3A47%3A37%22%7D%2C%7B%22K%22%3A%22VL_LastVisitTime%22%2C%22V%22%3A%222019-10-12%252013%253A17%253A37%22%2C%22E%22%3A%222021-10-01%2013%3A17%3A37%22%7D%2C%7B%22K%22%3A%22VL_LastVisitResumes%22%2C%22V%22%3A%221%22%2C%22E%22%3A%222019-10-12%2013%3A47%3A37%22%7D%5D%7D
Upgrade-Insecure-Requests: 1
Pragma: no-cache
Cache-Control: no-cache"));

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return str_replace(array("\n", "\t", "\r"), '', $curlResult);
    }
endif;

if (!function_exists("misli_popular")) {
    function misli_popular($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "10");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", "Host: apivx.misli.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:80.0) Gecko/20100101 Firefox/80.0
Accept: */*
Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate, br
Access-Control-Request-Method: GET
Referer: https://www.misli.com/
Origin: https://www.misli.com
Connection: keep-alive
Pragma: no-cache
Cache-Control: no-cache"));

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return $curlResult;
    }
}
if (!function_exists("iddaa_bulten")) :
    function iddaa_bulten($type)
    {
        $curl = curl_init("https://api.iddaa.com.tr/sportsprogram/" . $type);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");

        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, array(
            "Host: api.iddaa.com.tr",
            "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:70.0) Gecko/20100101 Firefox/70.0",
            "Accept: application/json, text/plain, */*",
            "Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
            "Accept-Encoding: gzip, deflate, br",
            "Content-Type: application/json;charset=utf-8"
        ));
        curl_setopt($curl, CURLOPT_POST, 1);
        if ($type == 1) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, '["1_1","2_87","2_7_2.5","2_101_2.5","2_89"]');
        } elseif ($type == 2) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, '["1_2","2_114","2_622","2_107","2_621"]');
        }

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return $curlResult;
    }
endif;

if (!function_exists("iddaa_market")) :
    function iddaa_market($sport_code, $code)
    {
        $curl = curl_init("https://api.iddaa.com.tr/sportsprogram/markets/$sport_code/" . $code);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return json_decode($curlResult, true);
    }
endif;

if (!function_exists("sahadan")) :
    function sahadan($type = "all", $date)
    {
        date_default_timezone_set('Europe/Istanbul');
        switch ($type) {
            case 'football':
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json?sports[]=Soccer&matchDate=" . $date;
                break;
            case 'basketball':
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json?sports[]=Basketball&matchDate=" . $date;
                break;

            case 'all':
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json?sports[]=Soccer&sports[]=Basketball&matchDate=" . $date;
                break;
            default:
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json?sports[]=Soccer&sports[]=Basketball&matchDate=" . $date;
                break;
        }
        $curl = curl_init($url_code);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return json_decode($curlResult, true);
    }
endif;

if (!function_exists("sahadan_update")) :
    function sahadan_update($type = "all", $date)
    {
        date_default_timezone_set('Europe/Istanbul');
        switch ($type) {
            case 'football':
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json-update?sports[]=Soccer&matchDate=" . $date;
                break;
            case 'basketball':
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json-update?sports[]=Basketball&matchDate=" . $date;
                break;

            case 'all':
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json-update?sports[]=Soccer&sports[]=Basketball&matchDate=" . $date;
                break;
            default:
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json-update?sports[]=Soccer&sports[]=Basketball&matchDate=" . $date;
                break;
        }
        $curl = curl_init($url_code);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return json_decode($curlResult, true);
    }
endif;


if (!function_exists("sahadan_date")) :
    function sahadan_date($tarih, $type = "all")
    {
        date_default_timezone_set('Europe/Istanbul');
        switch ($type) {
            case 'football':
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json?sports[]=Soccer&matchDate=" . $tarih;
                break;
            case 'basketball':
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json?sports[]=Basketball&matchDate=" . $tarih;
                break;

            case 'all':
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json?sports[]=Soccer&sports[]=Basketball&matchDate=" . $tarih;
                break;
            default:
                $url_code = "https://www.sahadan.com/perform/p0/ajax/components/competition/livescores/json?sports[]=Soccer&sports[]=Basketball&matchDate=" . $tarih;
                break;
        }
        $curl = curl_init($url_code);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return json_decode($curlResult, true);
    }
endif;


if (!function_exists("sahadan_lig")) :
    function sahadan_lig()
    {
        $curl = curl_init("https://www.sahadan.com/perform/p0/ajax/components/competition-list?ajaxViewName=competitions&type=TYPE_TOP&countryId%5B%5D=6kd6webenogylfgwt2aa9l6vx&groupsLoadingMode=sync");
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);
        $json_return = json_decode($curlResult, true)['data']['html'];
        preg_match_all('@<li class="p0c-competition-list__item"> <a href="(.*?)" class="p0c-competition-list__competition-link">  <img class="flag-24x24 p0c-competition-list__national-flag" srcset="(.*?)" src="(.*?)" alt="(.*?)" >  <span class="p0c-competition-list__competition-name"> (.*?) </span> <span class="p0c-competition-list__competition-type"> (.*?) </span> <span class="p0c-competition-list__expander p0c-competition-list__expander--disabled"></span> </a> </li>@si', $json_return, $lig_list);
        return $lig_list;
    }
endif;

if (!function_exists("sahadan_puan_durumu")) :
    function sahadan_puan_durumu($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return $curlResult;
    }
endif;

if (!function_exists("sahadan_fikstur_lig")) {
    function sahadan_fikstur_lig()
    {
        $curl = curl_init("https://www.sahadan.com/puan-durumu/t%C3%BCrkiye-trendyol-s%C3%BCper-lig/2024-2025/fikstur/482ofyysbdbeoxauk19yg7tdt?matchDateFrom=2024-08-30&matchDateTo=2024-09-01&sdapiLanguageCode=tr-mk&seasonId=1c0t9lv2rftjjx8dxn5s9csus&stageId=&fetchMode=gameweek&gameWeek=4&ajaxViewName=matches&ajaxPartialViewName=match&sportType=soccer&format=json");
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return json_decode($curlResult, true)['data']['html'];
    }
}

if (!function_exists("zamantr")) :
    function zamantr($girdi)
    {
        $cikti = date("l d F", $girdi);
        $aylarIng = array(
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        );
        $gunlerIng = array("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday");
        $aylar = array(
            "Ocak",
            "Şubat",
            "Mart",
            "Nisan",
            "Mayıs",
            "Haziran",
            "Temmuz",
            "Ağustos",
            "Eylül",
            "Ekim",
            "Kasım",
            "Aralık"
        );
        $gunler = array("Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar");
        $cikti = str_replace($aylarIng, $aylar, $cikti);
        $cikti = str_replace($gunlerIng, $gunler, $cikti);
        return $cikti;
    }
endif;


if (!function_exists("misli_bulten")) {
    function misli_bulten($bet_type = "SOCCER")
    {
        $curl = curl_init("https://apivx.misli.com/api/web/v1/sportsbook/event/0?sportType=" . $bet_type . "&betType=PRE_EVENT");
        curl_setopt($curl, CURLOPT_TIMEOUT, "10");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", "Host: apivx.misli.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:80.0) Gecko/20100101 Firefox/80.0
Accept: text/plain, */*
Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate, br
Origin: https://www.misli.com
Connection: keep-alive
Referer: https://www.misli.com/iddaa/futbol
Pragma: no-cache
Cache-Control: no-cache"));

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return $curlResult;
    }
}

if (!function_exists("wp_is_mobile")) :
    function wp_is_mobile()
    {
        if (empty($_SERVER['HTTP_USER_AGENT'])) {
            $is_mobile = false;
        } elseif (
            strpos($_SERVER['HTTP_USER_AGENT'], 'Mobile') !== false // Many mobile devices (all iPhone, iPad, etc.)
            || strpos($_SERVER['HTTP_USER_AGENT'], 'Android') !== false
            || strpos($_SERVER['HTTP_USER_AGENT'], 'Silk/') !== false
            || strpos($_SERVER['HTTP_USER_AGENT'], 'Kindle') !== false
            || strpos($_SERVER['HTTP_USER_AGENT'], 'BlackBerry') !== false
            || strpos($_SERVER['HTTP_USER_AGENT'], 'Opera Mini') !== false
            || strpos($_SERVER['HTTP_USER_AGENT'], 'Opera Mobi') !== false
        ) {
            $is_mobile = true;
        } else {
            $is_mobile = false;
        }

        return $is_mobile;
    }
endif;
if (!function_exists("misli_market")) :

    function misli_market($code)
    {
        $curl = curl_init("https://apivx.misli.com/api/web/v1/sportsbook/event/$code/single");
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", "Host: apivx.misli.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:80.0) Gecko/20100101 Firefox/80.0
Accept: text/plain, */*
Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate, br
Origin: https://www.misli.com
Connection: keep-alive
Referer: https://www.misli.com/iddaa/futbol
Pragma: no-cache
Cache-Control: no-cache"));


        $curlResult = curl_exec($curl);
        curl_close($curl);
        return $curlResult;
    }
endif;

if (!function_exists("misli_canli")) :
    function misli_canli()
    {
        $content = '{"betTypeId":"45"}';

        $curl = curl_init("https://www.misli.com/Bet/GetLiveBetLeft");
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $content);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", "Host: www.misli.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:70.0) Gecko/20100101 Firefox/70.0
Accept: application/json, text/plain, */*
Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate, br
Content-Type: application/json;charset=utf-8
X-Requested-With: XMLHttpRequest
Content-Length: " . strlen($content) . "
Origin: https://www.misli.com
Connection: keep-alive
Referer: https://www.misli.com/canli-iddaa/futbol
Cookie: ASP.NET_SessionId=r5jbvnpivmvkekqmmn4agf3v; BIGipServerML-Web-Prod=268501002.20480.0000
Pragma: no-cache
Cache-Control: no-cache"));


        $curlResult = curl_exec($curl);
        curl_close($curl);
        return $curlResult;
    }
endif;

if (!function_exists('mbs_to_string')) :
    function mbs_to_string($int)
    {
        $search_int  = array(1, 2, 3, 4, 5, 6);
        $find_str    = array('bir', 'iki', 'uc', 'dort', 'bes', 'alti');

        return str_replace($search_int, $find_str, $int);
    }
endif;

if (!function_exists('cs_status')) :
    function cs_status($str)
    {
        $search = array(1, 2);
        $find = array('up', 'down');

        return str_replace($search, $find, $str);
    }
endif;
if (!function_exists("misli_live_left")) {
    function misli_live_left($page, $bet_type = 45)
    {
        $content = '{"PageIndex":' . $page . ',"PageSize":50,"BetTypeId":"45","EventType":null,"MBC":null,"IsTV":null,"IsLiveEvent":null,"IsLiveStream":null,"NoData":false}';

        $curl = curl_init("https://www.misli.com/Bet/GetBetListLive");
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $content);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", "Host: www.misli.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:70.0) Gecko/20100101 Firefox/70.0
Accept: application/json, text/plain, */*
Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate, br
Content-Type: application/json;charset=utf-8
X-Requested-With: XMLHttpRequest
Content-Length: " . strlen($content) . "
Origin: https://www.misli.com
Connection: keep-alive
Referer: https://www.misli.com/iddaa-futbol
Pragma: no-cache
Cache-Control: no-cache"));

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return $curlResult;
    }
}


if (!function_exists("misli_curl")) :
    function misli_curl($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, explode("\n", "Host: www.misli.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:70.0) Gecko/20100101 Firefox/70.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Cookie: _pk_id.718.d9b3=e7baf62bda74dd1d.1569941775.3.1570876473.1570875458.; _fbp=fb.1.1569941776564.751091627; _ga=GA1.2.225670636.1569941778; ASP.NET_SessionId=rcilxltbll5ctypfs5laziky; BIGipServerML-Web-Prod=369164298.20480.0000; VLCV1OK=1; OfferMiner_ID=NKFBPGHEJXXLQHFD20191012014013; _gid=GA1.2.1858073997.1570833614; _pk_ses.718.d9b3=1; VL_CM_0=%7B%22Items%22%3A%5B%7B%22K%22%3A%22VL_LastPageViewTime%22%2C%22V%22%3A%222019-10-12%252013%253A34%253A32%22%2C%22E%22%3A%222021-10-01%2013%3A34%3A32%22%7D%2C%7B%22K%22%3A%22VL_TotalDuration%22%2C%22V%22%3A%221069%22%2C%22E%22%3A%222021-10-01%2013%3A34%3A32%22%7D%2C%7B%22K%22%3A%22VL_FirstVisitTime%22%2C%22V%22%3A%222019-10-12%252001%253A40%253A13%22%2C%22E%22%3A%222021-10-01%2001%3A40%3A13%22%7D%2C%7B%22K%22%3A%22VL_TotalPV%22%2C%22V%22%3A%2213%22%2C%22E%22%3A%222021-10-01%2013%3A34%3A32%22%7D%2C%7B%22K%22%3A%22VL_TotalVisit%22%2C%22V%22%3A%222%22%2C%22E%22%3A%222021-10-01%2013%3A17%3A37%22%7D%2C%7B%22K%22%3A%22OfferMiner_ID%22%2C%22V%22%3A%22NKFBPGHEJXXLQHFD20191012014013%22%2C%22E%22%3A%222021-10-01%2001%3A40%3A13%22%7D%2C%7B%22K%22%3A%22OM_INW%22%2C%22V%22%3A%221%22%2C%22E%22%3A%222021-10-01%2001%3A40%3A13%22%7D%2C%7B%22K%22%3A%22VLTVisitorC%22%2C%22V%22%3A%22%257B%2522data%2522%253A%257B%257D%257D%22%2C%22E%22%3A%222021-10-01%2013%3A34%3A33%22%7D%2C%7B%22K%22%3A%22OM_rDomain%22%2C%22V%22%3A%22https%253A%252F%252Fwww.misli.com%252F%22%2C%22E%22%3A%222021-10-01%2013%3A25%3A41%22%7D%2C%7B%22K%22%3A%22VL_LastPVTimeForTD%22%2C%22V%22%3A%222019-10-12%252013%253A34%253A32%22%2C%22E%22%3A%222019-10-12%2014%3A04%3A32%22%7D%2C%7B%22K%22%3A%22VL_PVCountInVisit%22%2C%22V%22%3A%2210%22%2C%22E%22%3A%222019-10-12%2014%3A04%3A32%22%7D%2C%7B%22K%22%3A%22VL_VisitStartTime%22%2C%22V%22%3A%222019-10-12%252013%253A17%253A37%22%2C%22E%22%3A%222019-10-12%2013%3A47%3A37%22%7D%2C%7B%22K%22%3A%22VL_LastVisitTime%22%2C%22V%22%3A%222019-10-12%252013%253A17%253A37%22%2C%22E%22%3A%222021-10-01%2013%3A17%3A37%22%7D%2C%7B%22K%22%3A%22VL_LastVisitResumes%22%2C%22V%22%3A%221%22%2C%22E%22%3A%222019-10-12%2013%3A47%3A37%22%7D%5D%7D
Upgrade-Insecure-Requests: 1
Pragma: no-cache
Cache-Control: no-cache"));

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return str_replace(array("\n", "\t", "\r"), null, $curlResult);
    }
endif;

if (!function_exists('sehir_replace')) {
    function sehir_replace($source)
    {
        $from = array(
            'Adiyaman',
            'Agri',
            'Aydin',
            'Balikesir',
            'Bilecik',
            'Canakkale',
            'Cankırı',
            'Corum',
            'Diyarbakir',
            'Elazig',
            'Eskisehir',
            'Gümüshane',
            'İsparta',
            'Kirklareli',
            'Kirsehir',
            'Kutahya',
            'Kahramanmaras',
            'Mugla',
            'Mus',
            'Nevsehir',
            'Nigde',
            'Tekirdag',
            'Sanliurfa',
            'Usak',
            'Kirikkale',
            'Sirnak',
            'Bartin',
            'İgdir',
            'Karabuk',
        );

        $to = array(
            'Adıyaman',
            'Ağrı',
            'Aydın',
            'Balıkesir',
            'Bilecik',
            'Çanakkale',
            'Çankırı',
            'Çorum',
            'Diyarbakır',
            'Elazığ',
            'Eskişehir',
            'Gümüşhane',
            'Isparta',
            'Kırklareli',
            'Kırşehir',
            'Kütahya',
            'Kahramanmaraş',
            'Muğla',
            'Muş',
            'Nevşehir',
            'Niğde',
            'Tekirdağ',
            'Şanlıurfa',
            'Uşak',
            'Kırıkkale',
            'Şırnak',
            'Bartın',
            'Iğdır',
            'Karabük',
        );

        return str_replace($from, $to, $source);
    }
}

if (!function_exists("sehir_array")) {
    function sehir_array()
    {
        $list = array(
            1 => 'Adana',
            2 => 'Adıyaman',
            3 => 'Afyonkarahisar',
            4 => 'Ağrı',
            5 => 'Amasya',
            6 => 'Ankara',
            7 => 'Antalya',
            8 => 'Artvin',
            9 => 'Aydın',
            10 => 'Balıkesir',
            11 => 'Bilecik',
            12 => 'Bingöl',
            13 => 'Bitlis',
            14 => 'Bolu',
            15 => 'Burdur',
            16 => 'Bursa',
            17 => 'Çanakkale',
            18 => 'Çankırı',
            19 => 'Çorum',
            20 => 'Denizli',
            21 => 'Diyarbakır',
            22 => 'Edirne',
            23 => 'Elazığ',
            24 => 'Erzincan',
            25 => 'Erzurum',
            26 => 'Eskişehir',
            27 => 'Gaziantep',
            28 => 'Giresun',
            29 => 'Gümüşhane',
            30 => 'Hakkâri',
            31 => 'Hatay',
            32 => 'Isparta',
            33 => 'Mersin',
            34 => 'İstanbul',
            35 => 'İzmir',
            36 => 'Kars',
            37 => 'Kastamonu',
            38 => 'Kayseri',
            39 => 'Kırklareli',
            40 => 'Kırşehir',
            41 => 'Kocaeli',
            42 => 'Konya',
            43 => 'Kütahya',
            44 => 'Malatya',
            45 => 'Manisa',
            46 => 'Kahramanmaraş',
            47 => 'Mardin',
            48 => 'Muğla',
            49 => 'Muş',
            50 => 'Nevşehir',
            51 => 'Niğde',
            52 => 'Ordu',
            53 => 'Rize',
            54 => 'Sakarya',
            55 => 'Samsun',
            56 => 'Siirt',
            57 => 'Sinop',
            58 => 'Sivas',
            59 => 'Tekirdağ',
            60 => 'Tokat',
            61 => 'Trabzon',
            62 => 'Tunceli',
            63 => 'Şanlıurfa',
            64 => 'Uşak',
            65 => 'Van',
            66 => 'Yozgat',
            67 => 'Zonguldak',
            68 => 'Aksaray',
            69 => 'Bayburt',
            70 => 'Karaman',
            71 => 'Kırıkkale',
            72 => 'Batman',
            73 => 'Şırnak',
            74 => 'Bartın',
            75 => 'Ardahan',
            76 => 'Iğdır',
            77 => 'Yalova',
            78 => 'Karabük',
            79 => 'Kilis',
            80 => 'Osmaniye',
            81 => 'Düzce',
        );

        return $list;
    }
}
if (!function_exists("plaka_to_sehir")) {
    function plaka_to_sehir($id)
    {
        $nameList = array(
            1 => 'Adana',
            2 => 'Adıyaman',
            3 => 'Afyonkarahisar',
            4 => 'Ağrı',
            5 => 'Amasya',
            6 => 'Ankara',
            7 => 'Antalya',
            8 => 'Artvin',
            9 => 'Aydın',
            10 => 'Balıkesir',
            11 => 'Bilecik',
            12 => 'Bingöl',
            13 => 'Bitlis',
            14 => 'Bolu',
            15 => 'Burdur',
            16 => 'Bursa',
            17 => 'Çanakkale',
            18 => 'Çankırı',
            19 => 'Çorum',
            20 => 'Denizli',
            21 => 'Diyarbakır',
            22 => 'Edirne',
            23 => 'Elazığ',
            24 => 'Erzincan',
            25 => 'Erzurum',
            26 => 'Eskişehir',
            27 => 'Gaziantep',
            28 => 'Giresun',
            29 => 'Gümüşhane',
            30 => 'Hakkâri',
            31 => 'Hatay',
            32 => 'Isparta',
            33 => 'Mersin',
            34 => 'İstanbul',
            35 => 'İzmir',
            36 => 'Kars',
            37 => 'Kastamonu',
            38 => 'Kayseri',
            39 => 'Kırklareli',
            40 => 'Kırşehir',
            41 => 'Kocaeli',
            42 => 'Konya',
            43 => 'Kütahya',
            44 => 'Malatya',
            45 => 'Manisa',
            46 => 'Kahramanmaraş',
            47 => 'Mardin',
            48 => 'Muğla',
            49 => 'Muş',
            50 => 'Nevşehir',
            51 => 'Niğde',
            52 => 'Ordu',
            53 => 'Rize',
            54 => 'Sakarya',
            55 => 'Samsun',
            56 => 'Siirt',
            57 => 'Sinop',
            58 => 'Sivas',
            59 => 'Tekirdağ',
            60 => 'Tokat',
            61 => 'Trabzon',
            62 => 'Tunceli',
            63 => 'Şanlıurfa',
            64 => 'Uşak',
            65 => 'Van',
            66 => 'Yozgat',
            67 => 'Zonguldak',
            68 => 'Aksaray',
            69 => 'Bayburt',
            70 => 'Karaman',
            71 => 'Kırıkkale',
            72 => 'Batman',
            73 => 'Şırnak',
            74 => 'Bartın',
            75 => 'Ardahan',
            76 => 'Iğdır',
            77 => 'Yalova',
            78 => 'Karabük',
            79 => 'Kilis',
            80 => 'Osmaniye',
            81 => 'Düzce',
            82 => 'Lefkoşa',
            83 => 'Bakü',
            84 => 'Amsterdam',
        );

        $nameList = array_reverse($nameList, true);

        foreach ($nameList as $key_sehir => $value_sehir) {
            $plaka_id[$key_sehir] = $key_sehir;
            $sehir_name[$key_sehir] = $value_sehir;
        }


        return str_replace($plaka_id, $sehir_name, $id);
    }
}
if (!function_exists("sortAssociativeArrayByKey")) :
    function sortAssociativeArrayByKey($array, $key, $direction)
    {
        switch ($direction) {
            case "ASC":
                usort($array, function ($first, $second) use ($key) {
                    return $first[$key] <=> $second[$key];
                });
                break;
            case "DESC":
                usort($array, function ($first, $second) use ($key) {
                    return $second[$key] <=> $first[$key];
                });
                break;
            default:
                break;
        }

        return $array;
    }
endif;

if (!function_exists("get_url_doviz_auth")) {
    function get_url_doviz_auth($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.122 Safari/534.30");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 1);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $curlResult = curl_exec($curl);
        curl_close($curl);
        return str_replace(array("\n", "\t", "\r"), null, $curlResult);
    }
}

if (!function_exists("get_url_doviz")) {
    function get_url_doviz($url, $auth)
    {
        preg_match_all('@/assets/(.*?)/daily@si', $url, $coin_name);
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "50");
        curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.122 Safari/534.30");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, ['authorization: Bearer ' . $auth]);



        $curlResult = curl_exec($curl);
        curl_close($curl);
        return str_replace(array("\n", "\t", "\r"), '', $curlResult);
    }
}

if (!function_exists('get_namaz_city')) {
    function get_namaz_city($city_id = null)
    {
        $nameListEzan = [
            9146  => 'Adana',
            9158  => 'Adiyaman',
            9167  => 'Afyonkarahi̇sar',
            9185  => 'Ağri',
            9192  => 'Aksaray',
            9198  => 'Amasya',
            9205  => 'Ankara',
            9222  => 'Antalya',
            9238  => 'Ardahan',
            9244  => 'Artvi̇n',
            9252  => 'Aydin',
            9269  => 'Balikesi̇r',
            9285  => 'Bartin',
            9288  => 'Batman',
            9294  => 'Bayburt',
            9297  => 'Bi̇leci̇k',
            17889 => 'Bi̇ngöl',
            9309  => 'Bi̇tli̇s',
            9315  => 'Bolu',
            9324  => 'Burdur',
            9335  => 'Bursa',
            9347  => 'Çanakkale',
            9357  => 'Çankiri',
            9367  => 'Çorum',
            19020 => 'Deni̇zli̇',
            9397  => 'Di̇yarbakir',
            9411  => 'Düzce',
            9419  => 'Edi̇rne',
            9428  => 'Elaziğ',
            9439  => 'Erzi̇ncan',
            9448  => 'Erzurum',
            9467  => 'Eski̇şehi̇r',
            9478  => 'Gazi̇antep',
            9486  => 'Gi̇resun',
            9501  => 'Gümüşhane',
            9506  => 'Hakkari̇',
            9510  => 'Hatay',
            9521  => 'Iğdir',
            9525  => 'Isparta',
            9541  => 'İstanbul',
            9560  => 'İzmi̇r',
            9571  => 'Kahramanmaraş',
            9580  => 'Karabük',
            9584  => 'Karaman',
            9590  => 'Kars',
            9597  => 'Kastamonu',
            9615  => 'Kayseri̇',
            9628  => 'Ki̇li̇s',
            9631  => 'Kirikkale',
            17903 => 'Kirklareli̇',
            20039 => 'Kirşehi̇r',
            9648  => 'Kocaeli̇',
            9656  => 'Konya',
            9682  => 'Kütahya',
            9694  => 'Malatya',
            9707  => 'Mani̇sa',
            9723  => 'Mardi̇n',
            9731  => 'Mersi̇n',
            9741  => 'Muğla',
            9751  => 'Muş',
            9757  => 'Nevşehi̇r',
            9762  => 'Ni̇ğde',
            9768  => 'Ordu',
            9784  => 'Osmani̇ye',
            9791  => 'Ri̇ze',
            9800  => 'Sakarya',
            9809  => 'Samsun',
            9824  => 'Şanliurfa',
            9835  => 'Si̇i̇rt',
            9840  => 'Si̇nop',
            9849  => 'şirnak',
            9856  => 'Si̇vas',
            9872  => 'Teki̇rdağ',
            9880  => 'Tokat',
            9891  => 'Trabzon',
            9908  => 'Tunceli̇',
            9915  => 'Uşak',
            9920  => 'Van',
            9931  => 'Yalova',
            9949  => 'Yozgat',
            9955  => 'Zonguldak',
        ];

        if ($city_id) {
            return $nameListEzan[$city_id];
        }
        return $nameListEzan;
    }
}

if(!function_exists("getMarketName")):
    function getMarketName($name){
        $search = array(
            '1-1{}', '1-101{}','1-60{}','1-77{}','1-101{}',
            '1-4{}','1-88{}','1-92{}','1-90{}', '1-91{}','1-89',
            '1-100{}','1-69{}','1-45{}','1-11{}','1-44{}','1-43{}',
            '1-55{}','1-84{}','1-6{}','1-644{}','1-643{}','1-603{}',
            '1-86{}','1-36{}','1-7{}','1-87{}',
            '1-113{}','1-114{}','1-621{}','1-2{}','1-622{}',
            '1-10{}', '1-601{}', '1-163{}', '1-21{}', '1-164{}',
            '1-157{}', '1-158{}', '1-617{}', '1-641{}', '1-642{}',
            '1-647{}', '1-166{}', '1-9{}', '1-648{}', '1-167{}',
            '1-217{}', '1-220{}', '1-231{}'
        );

        $replace = array(
            'Maç Sonucu', 'Alt / Üst','İlk Yarı Alt / Üst','İlk Yarı Çifte Şans','Alt Üst',
            'Toplam Gol', 'İlk Yarı Sonucu', 'Çifte Şans', 'İlk Yarı Maç Sonucu', 'Tek / Çift', 'Karşılıklı Gol',
            'Handikaplı Maç Sonucu', 'Ev Sahibi Her İki Yarıyı Kazanır', 'Hangi Takım Gol Atar', 'Hangi Takım Kaç Farkla Kazanır?', 'Deplasman Gol Yemeden Bitirir', 'Ev Sahibi Gol Yemeden Bitirir',
            'Deplasman Hangi Yarıda Daha Fazla Gol Atar','Ev Sahibi Hangi Yarıda Daha Fazla Gol Atar','Hangi Yarıda Daha Fazla Gol olur', 'Deplasman Gol Yemeden Kazanır', 'Ev Sahibi Gol Yemeden Kazanır', 'Ev Sahibi Alt/Üst',
            'Maç Skoru', 'İkinci Yarı Sonucu', 'Maç Sonucu ve Alt/Üst', 'İlk Golü Hangi Takım Atar',
            'Handikaplı İlk Yarı Sonucu', 'Handikaplı Maç Sonucu', 'İlk Yarı Sonucu', 'Maç Sonucu', 'Maç Sonucu ve Alt/Üst',
            'Maç Sonucu', 'Maç Sonucu (Uz. Dahil)', 'Handikaplı Maç Sonucu', 'Maç Sonucu', 'Alt / Üst',
            'Karşılıklı Gol', 'Tek / Çift', 'Hangi Takım Kaç Farkla Kazanır', 'Handikaplı Maç Sonucu', 'Alt / Üst',
            '1. Oyuncu Set Kazanır', '1. Set Sonucu', 'Maç Sonucu', '2. Oyuncu Set Kazanır', '2. Set Sonucu',
            'Alt Üst', 'Maç Skoru (5 Set)', 'Handikaplı Sayı Sonucu'
        );
        $result = str_replace( $search, $replace, $name );
        if(strstr($result, '{}')) {
            $result = 'Handikap';
        }
        return $result;
    }
endif;

if (!function_exists('cs_status')) :
    function cs_status($str)
    {
        $search = array(1, 2);
        $find = array('up', 'down');

        return str_replace($search, $find, $str);
    }
endif;
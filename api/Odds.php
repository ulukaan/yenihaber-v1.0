<?php

class Odds
{
    private $base_url;
    private $main_data;

    public function __construct($sport_type, $additional_fields = [])
    {
        $this->base_url = 'https://aping.bilyoner.com/desktop/aggregator/iddaa/gamelist/iddaa/' . $sport_type . '?filterType=all&league=false&' . http_build_query($additional_fields);
        $this->setMainData();
    }

    private function getURL($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_TIMEOUT, "10");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_ENCODING, "UTF-8");
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_HTTPHEADER, [
            'Host: aping.bilyoner.com',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:101.0) Gecko/20100101 Firefox/101.0',
            'Accept: application/json, text/plain, */*',
            'Accept-Language: en-US,en;q=0.5',
            'Accept-Encoding: gzip, deflate, br',
            'Referer: https://www.bilyoner.com/',
            'Content-Type: application/json',
        ]);
        $data = curl_exec($curl);
        curl_close($curl);

        return json_decode($data, true);
    }

    private function setMainData()
    {
        $this->main_data = $this->getURL($this->base_url);
    }

    private function getMainData()
    {
        return $this->main_data;
    }

    public function getMatch()
    {
        return $this->getMainData()['tabs'][0]['eventGroups'] ?? $this->getMainData();
    }

    public function getOdds($data)
    {
        $odds = [];
        foreach ($data as $item) {
            array_walk_recursive($item['odds'], function (&$item, $key) {
                if ($item == '0') {
                    $item = '-';
                }
            });
            switch ($item['name']) {
                case 'Maç Sonucu':
                    $odds['ms'] = $item['odds'];
                    break;
                case 'İlk Yarı Çifte Şans':
                    $odds['iyc'] = $item['odds'];
                    break;
                case 'Toplam Gol':
                    $odds['tg'] = $item['odds'];
                    break;
                case 'İlk Yarı Alt / Üst 1,5':
                    $odds['iyau15'] = $item['odds'];
                    break;
                case '2,5 Alt / Üst':
                    $odds['25au'] = $item['odds'];
                    break;
                case 'Karşılıklı Gol':
                    $odds['kg'] = $item['odds'];
                    break;
                case 'İlk Yarı Sonucu':
                    $odds['iys'] = $item['odds'];
                    break;
                case 'İlk Yarı Alt / Üst':
                    $odds['iyau'] = $item['odds'];
                    break;
                case 'Ev Sahibi Alt / Üst':
                    $odds['evau'] = $item['odds'];
                    break;
                case 'Deplasman Alt / Üst':
                    $odds['deau'] = $item['odds'];
                    break;
                case 'İlk Çeyrek Sonucu':
                    $odds['iycs'] = $item['odds'];
                    break;
                case 'Alt / Üst':
                    $odds['au'] = $item['odds'];
                    break;
            }
        }

        return $odds;
    }
}

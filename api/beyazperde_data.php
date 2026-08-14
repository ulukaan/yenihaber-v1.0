<?php
include 'api_helper.php';

class BeyazPerde
{
    public function vizyon($url = 'https://www.beyazperde.com/filmler/vizyondakiler/sinema-sayisi/')
    {
        $kaynak = get_url_curl($url);
        preg_match_all('@<li class="mdl">(.*?)</li>@si', $kaynak, $lists);

        if (strstr($url, 'en-merak-edilenler')) {
            $max_num = 11;
        } else {
            $max_num = 4;
        }

        foreach ($lists[1] as $list) {
            preg_match_all('@<img class="thumbnail-img" src="(.*?)"@si', $list, $thumbnail);
            preg_match_all('@<img class="thumbnail-img" src="(.*?)" data-src="(.*?)"@si', $list, $thumbnail_data_src);
            preg_match_all('@<a class="meta-title-link" href="/filmler/film-(.*?)/">(.*?)</a>@si', $list, $title);
            preg_match_all('@<span class="date">(.*?)</span>@si', $list, $date);
            preg_match_all('@<span class="spacer">/</span>(.*?)<span class="spacer">/</span>@si', $list, $time);
            preg_match_all('@<div class="meta-body-item meta-body-info">(.*?)</div>@si', $list, $meta_data);
            preg_match_all('@<span class="(.*?)">(.*?)</span>@si', $meta_data[1][0], $categories);
            preg_match_all('@<div class="meta-body-item meta-body-direction ">(.*?)</div>@si', $list, $director_and_scenarist);
            preg_match_all('@<div class="meta-body-item meta-body-actor">(.*?)</div>@si', $list, $actor);
            preg_match_all('@<span class="light">Orijinal adı </span>(.*?)</div>@si', $list, $original_name);
            preg_match_all('@<div class="content-txt ">(.*?)</div>@si', $list, $description);

            $thumbnail[1][0] = $thumbnail_data_src[2][0] ?: $thumbnail[1][0];

            unset($categories[2][0]);
            if ($title[2][0]) {
                $data[] = array(
                    'thumbnail' => $thumbnail[1][0],
                    'title' => $title[2][0],
                    'url' => $title[1][0],
                    'date' => $date[1][0],
                    'time' => $time[1][0],
                    'categories' => str_replace(array('/,/,', '/,'), '', implode(',', $categories[2])),
                    'director' => str_replace('Yönetmen', '', strip_tags($director_and_scenarist[1][0])),
                    'scenarist' => str_replace('Senarist', '', strip_tags($director_and_scenarist[1][1])),
                    'actor' => str_replace('Oyuncular:', '', strip_tags($actor[1][0])),
                    'original_name' => $original_name[1][0],
                    'description' => $description[1][0],
                    'max_num' => $max_num
                );
            }
        }

        return $data;
    }

    public function getData($id)
    {
        $kaynak = get_url_curl('https://www.beyazperde.com/filmler/film-' . $id . '/');

        preg_match_all('@<meta property="og:title" content="(.*?)" />@si', $kaynak, $title);
        preg_match_all('@<meta property="og:image" content="(.*?)" />@si', $kaynak, $image);
        preg_match_all('@<div class="content-txt ">(.*?)</div>@si', $kaynak, $description);
        preg_match_all('@<div class="meta-body-item meta-body-info">(.*?)</div>@si', $kaynak, $meta_info);
        preg_match_all('@<div class="meta-body-item(.*?)"><span class="light">(.*?)</span>(.*?)</div>@si', $kaynak, $meta_item);
        preg_match_all('@<a class="trailer roller-item"   href="/filmler/film-'.$id.'/fragman-(.*?)/" title@si', $kaynak, $fragman_id);
        preg_match_all('@<span class="review-card-meta-date light">                  (.*?)tarihinde eklendi                </span> @si', $kaynak, $date);
        
        
        preg_match_all('@<span class="spacer">|</span>(.*?)</div><div class="meta-body-item meta-body-direction ">@si', $kaynak, $categories);
        preg_match_all('@<span class="(.*?) dark-grey-link">(.*?)</span>@si', $kaynak, $category_default);

        $fragman_kaynak = get_url_curl($ad = 'https://www.beyazperde.com/filmler/film-' . $id . '/fragman-' . $fragman_id[1][0] . '/');

        preg_match_all('@"contentUrl": "(.*?)",@si', $fragman_kaynak, $fragman);
        preg_match_all('@</span>                                                                                        <span class="spacer">(.*?)</span>                                                                                                                            (.*?)                                                                                    <span class="spacer">@si', $kaynak, $duration);

        $meta_info_explode = explode('/', strip_tags(str_replace('</span>', ' ', $meta_info[1][0])));
        $meta_info_clean = $meta_info_explode[0] . ' <i>' . $meta_info_explode[1] . '</i>';

        return array(
            'title' => $title[1][0],
            'thumbnail' => $image[1][0],
            'description' => $description[1][0],
            'meta_info' => $meta_info_clean,
            'meta_item' => $meta_item,
            'fragman' => $fragman[1][1],
            'date' => $date[1][0],
            'duration' => $duration[2][0],
            'categories' => $category_default[2][0]
        );
    }

    public function getPageURL($num, $url)
    {
        $num = ltrim($num, '0');

        if (@$_GET['list']) {
            return home_url($url) . "?list=" . $_GET['list'] . '&sayfa=' . $num;
        } else {
            return home_url($url) . '?sayfa=' . $num;
        }
    }
}

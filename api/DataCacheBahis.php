<?php
if (!class_exists('DataCacheBahis')) {
    class DataCacheBahis
    {
        private $dir = 'birhaber-cache';
        private $cache_time;
        
        public function __construct($cache_time = 30)
        {
            $this->cache_time = $cache_time * 60;
            if (!is_dir($this->dir)) {
                mkdir($this->dir, 0755, true);
            }
        }
        
        public function get($file)
        {
            $file_path = $this->dir . '/' . $file;
            if (is_file($file_path)) {
                $file_content = file_get_contents($file_path);
                $file_content = str_replace(
                    ['\u8139', 'altin-ons', '\uff83-yrek', 'alt\uff84\uff71n'],
                    ['i', 'ons-altin-usd', 'ceyrek', 'altin'],
                    $file_content
                );
                $file = json_decode($file_content, true);
                if (time() < $file['time'] + $this->cache_time) {
                    return $file['data'];
                } else {
                    return false;
                }
            }
            
            return false;
        }
        
        public function write($file, $content)
        {
            $clean_content['data'] = $content;
            $clean_content['time'] = time();
            $last_content = json_encode($clean_content, true);
            $file_path = $this->dir . '/' . $file;
            
            file_put_contents($file_path, $last_content);
        }
    }
}

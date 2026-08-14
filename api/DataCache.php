<?php
if (!class_exists('DataCache')) {
	class DataCache
	{
		private $dir = 'birhaber-cache';
		private $cache_time;
		
		public function __construct($cache_time = 30)
		{
			$this->cache_time = $cache_time * 60;
		}
		
		public function get($file)
		{
			$uploads_dir = trailingslashit(wp_upload_dir()['basedir']) . $this->dir;
			if (is_file($uploads_dir . '/' . $file)) {
				$file = json_decode(
					str_replace(
						['\u8139', 'altin-ons', '\uff83-yrek', 'alt\uff84\uff71n'],
						['i', 'ons-altin-usd', 'ceyrek', 'altin'],
						file_get_contents($uploads_dir . '/' . $file)
					),
					true
				);
				if (time() < $file['time'] + $this->cache_time) {
					return $file['data'];
					//return false;
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
			$uploads_dir = trailingslashit(wp_upload_dir()['basedir']) . $this->dir;
			if (!is_dir($uploads_dir)) {
				wp_mkdir_p($uploads_dir);
			}
			
			$dt = fopen($uploads_dir . '/' . $file, 'w');
			fwrite($dt, $last_content);
			fclose($dt);
		}
	}
}

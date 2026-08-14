<?php
/**
 * Burç Uyumu API
 * 
 * @package BirHaber
 * @since 6.9.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get burç uyumu data
 */
function birhaber_get_burc_uyumu($burc1, $burc2) {
    // Burç uyumluluk verileri
    $uyumluluk = [
        'koc' => [
            'koc' => 85,
            'boga' => 45,
            'ikizler' => 75,
            'yengec' => 40,
            'aslan' => 90,
            'basak' => 50,
            'terazi' => 70,
            'akrep' => 60,
            'yay' => 95,
            'oglak' => 55,
            'kova' => 80,
            'balik' => 35
        ],
        'boga' => [
            'koc' => 45,
            'boga' => 90,
            'ikizler' => 40,
            'yengec' => 75,
            'aslan' => 50,
            'basak' => 85,
            'terazi' => 60,
            'akrep' => 70,
            'yay' => 35,
            'oglak' => 95,
            'kova' => 55,
            'balik' => 80
        ],
        'ikizler' => [
            'koc' => 75,
            'boga' => 40,
            'ikizler' => 85,
            'yengec' => 50,
            'aslan' => 70,
            'basak' => 60,
            'terazi' => 90,
            'akrep' => 45,
            'yay' => 80,
            'oglak' => 35,
            'kova' => 95,
            'balik' => 55
        ],
        'yengec' => [
            'koc' => 40,
            'boga' => 75,
            'ikizler' => 50,
            'yengec' => 90,
            'aslan' => 35,
            'basak' => 70,
            'terazi' => 55,
            'akrep' => 85,
            'yay' => 45,
            'oglak' => 80,
            'kova' => 60,
            'balik' => 95
        ],
        'aslan' => [
            'koc' => 90,
            'boga' => 50,
            'ikizler' => 70,
            'yengec' => 35,
            'aslan' => 85,
            'basak' => 45,
            'terazi' => 80,
            'akrep' => 55,
            'yay' => 95,
            'oglak' => 60,
            'kova' => 75,
            'balik' => 40
        ],
        'basak' => [
            'koc' => 50,
            'boga' => 85,
            'ikizler' => 60,
            'yengec' => 70,
            'aslan' => 45,
            'basak' => 90,
            'terazi' => 55,
            'akrep' => 80,
            'yay' => 40,
            'oglak' => 95,
            'kova' => 65,
            'balik' => 75
        ],
        'terazi' => [
            'koc' => 70,
            'boga' => 60,
            'ikizler' => 90,
            'yengec' => 55,
            'aslan' => 80,
            'basak' => 55,
            'terazi' => 85,
            'akrep' => 50,
            'yay' => 75,
            'oglak' => 45,
            'kova' => 95,
            'balik' => 65
        ],
        'akrep' => [
            'koc' => 60,
            'boga' => 70,
            'ikizler' => 45,
            'yengec' => 85,
            'aslan' => 55,
            'basak' => 80,
            'terazi' => 50,
            'akrep' => 90,
            'yay' => 65,
            'oglak' => 75,
            'kova' => 40,
            'balik' => 95
        ],
        'yay' => [
            'koc' => 95,
            'boga' => 35,
            'ikizler' => 80,
            'yengec' => 45,
            'aslan' => 95,
            'basak' => 40,
            'terazi' => 75,
            'akrep' => 65,
            'yay' => 85,
            'oglak' => 50,
            'kova' => 90,
            'balik' => 55
        ],
        'oglak' => [
            'koc' => 55,
            'boga' => 95,
            'ikizler' => 35,
            'yengec' => 80,
            'aslan' => 60,
            'basak' => 95,
            'terazi' => 45,
            'akrep' => 75,
            'yay' => 50,
            'oglak' => 90,
            'kova' => 70,
            'balik' => 85
        ],
        'kova' => [
            'koc' => 80,
            'boga' => 55,
            'ikizler' => 95,
            'yengec' => 60,
            'aslan' => 75,
            'basak' => 65,
            'terazi' => 95,
            'akrep' => 40,
            'yay' => 90,
            'oglak' => 70,
            'kova' => 85,
            'balik' => 50
        ],
        'balik' => [
            'koc' => 35,
            'boga' => 80,
            'ikizler' => 55,
            'yengec' => 95,
            'aslan' => 40,
            'basak' => 75,
            'terazi' => 65,
            'akrep' => 95,
            'yay' => 55,
            'oglak' => 85,
            'kova' => 50,
            'balik' => 90
        ]
    ];
    
    $burc1 = strtolower($burc1);
    $burc2 = strtolower($burc2);
    
    if (isset($uyumluluk[$burc1][$burc2])) {
        return $uyumluluk[$burc1][$burc2];
    }
    
    return 50; // Default uyumluluk
}

/**
 * Get burç uyumu description
 */
function birhaber_get_burc_uyumu_description($score) {
    if ($score >= 90) {
        return 'Mükemmel uyum!';
    } elseif ($score >= 80) {
        return 'Çok iyi uyum';
    } elseif ($score >= 70) {
        return 'İyi uyum';
    } elseif ($score >= 60) {
        return 'Orta uyum';
    } elseif ($score >= 50) {
        return 'Normal uyum';
    } else {
        return 'Zayıf uyum';
    }
}

// AJAX handler for burç uyumu
if (isset($_POST['action']) && $_POST['action'] === 'get_burc_uyumu') {
    $burc1 = sanitize_text_field($_POST['burc1']);
    $burc2 = sanitize_text_field($_POST['burc2']);
    
    $score = birhaber_get_burc_uyumu($burc1, $burc2);
    $description = birhaber_get_burc_uyumu_description($score);
    
    wp_send_json_success([
        'score' => $score,
        'description' => $description
    ]);
}
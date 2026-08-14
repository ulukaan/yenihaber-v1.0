<?php
/**
 * Gazete Bileşen API
 * 
 * @package BirHaber
 * @since 6.9.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get newspaper components
 */
function birhaber_get_newspaper_components() {
    return [
        'headlines' => [
            'title' => 'Manşetler',
            'items' => [
                'Son dakika: Önemli gelişme',
                'Ekonomi haberleri',
                'Spor sonuçları',
                'Dünya gündemi'
            ]
        ],
        'weather' => [
            'title' => 'Hava Durumu',
            'items' => [
                'İstanbul: 15°C',
                'Ankara: 12°C',
                'İzmir: 18°C'
            ]
        ],
        'currency' => [
            'title' => 'Döviz Kurları',
            'items' => [
                'USD: 30.50',
                'EUR: 33.20',
                'GBP: 38.90'
            ]
        ]
    ];
}

// AJAX handler for newspaper components
if (isset($_POST['action']) && $_POST['action'] === 'get_newspaper_components') {
    $components = birhaber_get_newspaper_components();
    wp_send_json_success($components);
}

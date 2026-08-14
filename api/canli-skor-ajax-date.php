<?php
/**
 * Canlı Skor AJAX Date API
 * 
 * @package BirHaber
 * @since 6.9.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get live scores for a specific date
 */
function birhaber_get_live_scores($date = null) {
    if (!$date) {
        $date = current_time('Y-m-d');
    }
    
    // Sample live scores data
    $scores = [
        '2024-01-15' => [
            [
                'home_team' => 'Galatasaray',
                'away_team' => 'Fenerbahçe',
                'home_score' => 2,
                'away_score' => 1,
                'status' => 'finished',
                'league' => 'Süper Lig',
                'time' => '19:00'
            ]
        ]
    ];
    
    return isset($scores[$date]) ? $scores[$date] : [];
}

// AJAX handler for live scores
if (isset($_POST['action']) && $_POST['action'] === 'get_live_scores') {
    $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : null;
    $scores = birhaber_get_live_scores($date);
    
    wp_send_json_success($scores);
}

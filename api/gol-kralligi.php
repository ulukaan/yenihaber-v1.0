<?php
/**
 * Gol Krallığı API
 * 
 * @package BirHaber
 * @since 6.9.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get goal scorers data
 */
function birhaber_get_goal_scorers($league = 'süper-lig') {
    // Sample goal scorers data
    $scorers = [
        'süper-lig' => [
            [
                'player' => 'Edin Dzeko',
                'team' => 'Fenerbahçe',
                'goals' => 15,
                'assists' => 3
            ],
            [
                'player' => 'Mauro Icardi',
                'team' => 'Galatasaray',
                'goals' => 12,
                'assists' => 5
            ],
            [
                'player' => 'Vincent Aboubakar',
                'team' => 'Beşiktaş',
                'goals' => 10,
                'assists' => 2
            ]
        ]
    ];
    
    return isset($scorers[$league]) ? $scorers[$league] : [];
}

// AJAX handler for goal scorers
if (isset($_POST['action']) && $_POST['action'] === 'get_goal_scorers') {
    $league = isset($_POST['league']) ? sanitize_text_field($_POST['league']) : 'süper-lig';
    $scorers = birhaber_get_goal_scorers($league);
    
    wp_send_json_success($scorers);
}

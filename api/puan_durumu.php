<?php
include 'api_helper.php';

if ( ! empty( $_GET['lig'] ) ) {
	$get_data_lig = sahadan_lig();
	
	foreach ( $get_data_lig[1] as $key_lig => $value_link ) {
		$value_link = explode( "/puan-durumu/", urldecode( $value_link ) )[1];
		
		if ( explode( "/", $value_link )[0] == $_GET['lig'] ) {
			$current_lig = $value_link;
		}
	}
	
	$current_lig = sahadan_puan_durumu( $lig_link = "https://www.sahadan.com/puan-durumu/" . $current_lig );
} else {
	$get_data_lig = sahadan_lig();
	$current_lig  = sahadan_puan_durumu( 'https://www.mackolik.com/puan-durumu/t%C3%BCrkiye-s%C3%BCper-lig/482ofyysbdbeoxauk19yg7tdt?matchDateFrom=2024-08-09&matchDateTo=2024-08-12&sdapiLanguageCode=tr-mk&seasonId=1c0t9lv2rftjjx8dxn5s9csus&stageId=&fetchMode=daterange&gameWeek=&ajaxViewName=matches&ajaxPartialViewName=match&sportType=soccer&format=json' );
	
}


preg_match_all('@<tr class=" p0c-competition-tables__row p0c-competition-tables__row--rank-status p0c-competition-tables__row--rank-status-(.*?)  " data-team-name="(.*?)" data-team-id="(.*?)" data-team-abbreviation="(.*?)" data-rank-change="(.*?)"  >(.*?)</tr>@si', $current_lig, $team_tr);

foreach ($team_tr[6] as $team) {
	preg_match_all('@<span class="p0c-competition-tables__rank" data-value>(.*?)</span>@si', $team, $team_standing);
	preg_match_all('@<td data-split-table class="p0c-competition-tables__team"> <a href="https://www.mackolik.com/takim/(.*?)" class="p0c-competition-tables__link" data-jsblank="true" > <img class="p0c-competition-tables__crest" src="(.*?)" alt="(.*?)" > <span class="p0c-competition-tables__team-name p0c-competition-tables__team-name--full" data-value > (.*?) </span> <span class="p0c-competition-tables__team-name p0c-competition-tables__team-name--abbr" title="(.*?)" > (.*?) </span> </a> </td>@si', $team, $team_name);
	preg_match_all('@</td> <td data-split-table> (.*?) </td>@si', $team, $played);
	preg_match_all('@<td> (.*?) </td>@si', $team, $won);
	preg_match_all('@<td data-split-table class="p0c-competition-tables__plus-minus"> (.*?) </td>@si', $team, $goals_diff);
	preg_match_all('@<td class="widget-match-standings__pts"> (.*?) </td>@si', $team, $points);
	preg_match_all('@<td class="p0c-competition-tables__cell--bp-580"> (.*?) </td>@si', $team, $goals_statistic);
	preg_match_all('@class="p0c-competition-tables__match-status p0c-competition-tables__match-status--(.*?)  "> (.*?) </span>@si', $team, $last_matches);
	
	$teams_array[$team_name[5][0]] = [
		'name' => $team_name[4][0],
		'short_name' => $team_name[8][0],
		'logo' => str_replace('30x30', '150x150', $team_name[2][0]),
		'standing' => trim($team_standing[1][0]),
		'played' => $played[1][0],
		'won' => $won[1][0],
		'drawn' => $won[1][1],
		'lost' => $won[1][2],
		'goals_for' => $goals_statistic[1][0],
		'goals_against' => $goals_statistic[1][1],
		'goals_diff' => $goals_diff[1][0],
		'points' => $played[1][1],
		'last_matches' => $last_matches[2]
	];

	$clean_teams[]        = $teams_array[$team_name[5][0]]['name'];
	$clean_images[]       = $teams_array[$team_name[5][0]]['logo'];
	$clean_status[]       = $teams_array[$team_name[5][0]]['standing'];
	$clean_data[]         = $teams_array[$team_name[5][0]];
	$clean_total[]        = $teams_array[$team_name[5][0]]['played'];
	$clean_last_5_match[] = $teams_array[$team_name[5][0]]['last_matches'];
}
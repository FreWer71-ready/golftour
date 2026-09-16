export type RoundStatus = "upcoming" | "completed";

export interface Player {
  id: string;
  name: string;
  created_at: string;
}

export interface Tour {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Round {
  id: string;
  tour_id: string;
  course_name: string;
  round_date: string;
  tee_time: string | null;
  status: RoundStatus;
  sort_order: number;
  created_at: string;
}

export interface RoundScore {
  id: string;
  round_id: string;
  player_id: string;
  gross_score: number;
  handicap_strokes: number;
  net_score: number;
  created_at: string;
  updated_at: string;
}

export interface LongestDrive {
  id: string;
  round_id: string;
  player_id: string;
  hole: number;
  distance_m: number | null;
  created_at: string;
}

export interface ClosestToPin {
  id: string;
  round_id: string;
  player_id: string;
  hole: number;
  distance_m: number | null;
  created_at: string;
}

export interface ScoringRule {
  id: string;
  tour_id: string;
  position: number;
  points: number;
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

export interface RoundScoreRanked {
  id: string;
  round_id: string;
  player_id: string;
  tour_id: string;
  gross_score: number;
  handicap_strokes: number;
  net_score: number;
  position: number;
}

export interface TourLeaderboardRow {
  tour_id: string;
  player_id: string;
  player_name: string;
  total_net: number;
  total_gross: number;
  rounds_played: number;
  position: number;
}

export interface PlayerTourStats {
  tour_id: string;
  player_id: string;
  player_name: string;
  total_points: number;
  rounds_played: number;
  rounds_won: number;
  avg_position: number | null;
  longest_drive_wins: number;
  closest_to_pin_wins: number;
}

// Joined shapes used by the UI (player name resolved alongside the row).

export interface LongestDriveWithPlayer extends LongestDrive {
  player_name: string;
  course_name: string;
}

export interface ClosestToPinWithPlayer extends ClosestToPin {
  player_name: string;
  course_name: string;
}

export interface RoundScoreWithPlayer extends RoundScoreRanked {
  player_name: string;
}

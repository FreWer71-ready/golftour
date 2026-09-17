export type RoundStatus = "upcoming" | "ongoing" | "completed";
export type AwardKind = "longest_drive" | "closest_to_pin";

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

// Longest Drive and Closest to Pin: one measured result per player per
// round (unique(round_id, player_id) in the database) — a mini competition
// in its own right, not just a single "who won" record.
export interface LongestDrive {
  id: string;
  round_id: string;
  player_id: string;
  hole: number;
  distance_m: number;
  created_at: string;
}

export interface ClosestToPin {
  id: string;
  round_id: string;
  player_id: string;
  hole: number;
  distance_m: number;
  created_at: string;
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

export interface LongestDriveRanked {
  id: string;
  round_id: string;
  player_id: string;
  tour_id: string;
  hole: number;
  distance_m: number;
  position: number;
}

export interface ClosestToPinRanked {
  id: string;
  round_id: string;
  player_id: string;
  tour_id: string;
  hole: number;
  distance_m: number;
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

/** The points competition: fixed 10/8/6/4/2 per placement, across every
 *  round and every round's Longest Drive and Closest to Pin. */
export interface PointsLeaderboardRow {
  tour_id: string;
  player_id: string;
  player_name: string;
  total_points: number;
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

// Joined shapes used by the UI (player/course name resolved alongside the row).

export interface RoundScoreWithPlayer extends RoundScoreRanked {
  player_name: string;
}

export interface LongestDriveWithPlayer extends LongestDriveRanked {
  player_name: string;
  course_name: string;
}

export interface ClosestToPinWithPlayer extends ClosestToPinRanked {
  player_name: string;
  course_name: string;
}

/** One round's award winner, for the round-by-round breakdown table. */
export interface RoundAwardWinner {
  round_id: string;
  course_name: string;
  player_name: string | null;
  distance_m: number | null;
  hole: number | null;
}

import "server-only";
import { getServerSupabase } from "./supabase/server";
import type {
  ClosestToPinWithPlayer,
  LongestDriveWithPlayer,
  Player,
  PlayerTourStats,
  Round,
  RoundScoreWithPlayer,
  ScoringRule,
  Tour,
  TourLeaderboardRow,
} from "./types/database";

/** Throws with a readable message instead of letting a raw Postgrest error bubble up. */
function orThrow<T>(data: T | null, error: { message: string } | null, context: string): T {
  if (error) throw new Error(`${context}: ${error.message}`);
  if (data === null) throw new Error(`${context}: inget resultat`);
  return data;
}

/**
 * PostgREST serializes Postgres `bigint`/`numeric` values as strings (they
 * can exceed what a JS `number` can represent exactly), which affects every
 * `rank()`, `sum()`, `count()` and `avg()` result our views produce. Convert
 * explicitly wherever we read one, rather than trusting the JSON typing.
 */
function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function toNumberOrNull(value: unknown): number | null {
  return value === null || value === undefined ? null : toNumber(value);
}

export async function getActiveTour(): Promise<Tour | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("tours").select("*").eq("is_active", true).maybeSingle();
  if (error) throw new Error(`Kunde inte hämta touren: ${error.message}`);
  return data as Tour | null;
}

export async function getPlayers(): Promise<Player[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("players").select("*").order("name");
  return orThrow(data, error, "Kunde inte hämta spelare") as Player[];
}

export async function getRounds(tourId: string): Promise<Round[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("tour_id", tourId)
    .order("sort_order");
  return orThrow(data, error, "Kunde inte hämta ronder") as Round[];
}

export async function getRound(roundId: string): Promise<Round | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("rounds").select("*").eq("id", roundId).maybeSingle();
  if (error) throw new Error(`Kunde inte hämta ronden: ${error.message}`);
  return data as Round | null;
}

export async function getRoundScores(roundId: string): Promise<RoundScoreWithPlayer[]> {
  const supabase = getServerSupabase();

  // `round_scores_ranked` is a view, so PostgREST can't embed `players` on it
  // the way it can on real tables (no foreign key metadata to introspect) —
  // fetch the two and join them in JS instead.
  const [scoresResult, playersResult] = await Promise.all([
    supabase.from("round_scores_ranked").select("*").eq("round_id", roundId).order("position"),
    supabase.from("players").select("id, name"),
  ]);

  const rows = orThrow(scoresResult.data, scoresResult.error, "Kunde inte hämta scorecard") as Array<
    Omit<RoundScoreWithPlayer, "player_name">
  >;
  const players = orThrow(playersResult.data, playersResult.error, "Kunde inte hämta spelare") as Array<{
    id: string;
    name: string;
  }>;
  const nameById = new Map(players.map((player) => [player.id, player.name]));

  return rows.map((row) => ({
    ...row,
    position: toNumber(row.position), // rank() -> bigint -> string over the wire
    player_name: nameById.get(row.player_id) ?? "Okänd",
  }));
}

export async function getTourLeaderboard(tourId: string): Promise<TourLeaderboardRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("tour_leaderboard")
    .select("*")
    .eq("tour_id", tourId)
    .order("position");
  const rows = orThrow(data, error, "Kunde inte hämta leaderboard") as TourLeaderboardRow[];
  return rows.map((row) => ({
    ...row,
    total_net: toNumber(row.total_net),
    total_gross: toNumber(row.total_gross),
    rounds_played: toNumber(row.rounds_played),
    position: toNumber(row.position),
  }));
}

export async function getPlayerTourStats(tourId: string): Promise<PlayerTourStats[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("player_tour_stats")
    .select("*")
    .eq("tour_id", tourId)
    .order("total_points", { ascending: false });
  const rows = orThrow(data, error, "Kunde inte hämta statistik") as PlayerTourStats[];
  return rows.map((row) => ({
    ...row,
    total_points: toNumber(row.total_points),
    rounds_played: toNumber(row.rounds_played),
    rounds_won: toNumber(row.rounds_won),
    avg_position: toNumberOrNull(row.avg_position),
    longest_drive_wins: toNumber(row.longest_drive_wins),
    closest_to_pin_wins: toNumber(row.closest_to_pin_wins),
  }));
}

async function getAwardsBoard(
  table: "longest_drive" | "closest_to_pin",
  tourId: string,
  sort: "desc" | "asc"
): Promise<Array<LongestDriveWithPlayer | ClosestToPinWithPlayer>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from(table)
    .select("*, players(name), rounds!inner(course_name, tour_id)")
    .eq("rounds.tour_id", tourId)
    .order("distance_m", { ascending: sort === "asc", nullsFirst: false })
    .order("created_at", { ascending: false });

  const rows = orThrow(data, error, `Kunde inte hämta ${table}`) as Array<
    (LongestDriveWithPlayer | ClosestToPinWithPlayer) & {
      players: { name: string } | null;
      rounds: { course_name: string } | null;
    }
  >;
  return rows.map(({ players, rounds, distance_m, ...row }) => ({
    ...row,
    // Postgres `numeric` columns come back from PostgREST as strings, to
    // avoid silent precision loss — convert explicitly rather than trust JSON typing.
    distance_m: distance_m === null ? null : Number(distance_m),
    player_name: players?.name ?? "Okänd",
    course_name: rounds?.course_name ?? "",
  }));
}

/** Longest drive is a "bigger is better" award. */
export function getLongestDriveBoard(tourId: string) {
  return getAwardsBoard("longest_drive", tourId, "desc") as Promise<LongestDriveWithPlayer[]>;
}

/** Closest to pin is a "smaller is better" award. */
export function getClosestToPinBoard(tourId: string) {
  return getAwardsBoard("closest_to_pin", tourId, "asc") as Promise<ClosestToPinWithPlayer[]>;
}

export async function getScoringRules(tourId: string): Promise<ScoringRule[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("scoring_rules")
    .select("*")
    .eq("tour_id", tourId)
    .order("position");
  return orThrow(data, error, "Kunde inte hämta poängsystemet") as ScoringRule[];
}

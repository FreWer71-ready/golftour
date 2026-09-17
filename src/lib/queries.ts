import "server-only";
import { getServerSupabase } from "./supabase/server";
import type {
  AwardKind,
  ClosestToPinWithPlayer,
  LongestDriveWithPlayer,
  Player,
  PlayerTourStats,
  PointsLeaderboardRow,
  Round,
  RoundAwardWinner,
  RoundScoreWithPlayer,
  Tour,
  TourLeaderboardRow,
  YatzyLeaderboardRow,
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
 * `rank()`, `sum()`, `count()` and `avg()` result our views produce, plus
 * the `numeric` distance_m columns. Convert explicitly wherever we read one,
 * rather than trusting the JSON typing.
 */
function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function toNumberOrNull(value: unknown): number | null {
  return value === null || value === undefined ? null : toNumber(value);
}

function awardView(kind: AwardKind): "longest_drive_ranked" | "closest_to_pin_ranked" {
  return kind === "longest_drive" ? "longest_drive_ranked" : "closest_to_pin_ranked";
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

export async function getPointsLeaderboard(tourId: string): Promise<PointsLeaderboardRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("points_leaderboard")
    .select("*")
    .eq("tour_id", tourId)
    .order("position");
  const rows = orThrow(data, error, "Kunde inte hämta poängtävlingen") as PointsLeaderboardRow[];
  return rows.map((row) => ({
    ...row,
    total_points: toNumber(row.total_points),
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

/** All ranked results for one round's Longest Drive or Closest to Pin — the
 *  per-round table shown on the round page, alongside the entry form. */
export async function getRoundAwards(
  roundId: string,
  kind: AwardKind
): Promise<Array<{ id: string; player_id: string; player_name: string; hole: number; distance_m: number; position: number }>> {
  const supabase = getServerSupabase();
  const [awardsResult, playersResult] = await Promise.all([
    supabase.from(awardView(kind)).select("*").eq("round_id", roundId).order("position"),
    supabase.from("players").select("id, name"),
  ]);

  const rows = orThrow(awardsResult.data, awardsResult.error, "Kunde inte hämta resultat") as Array<{
    id: string;
    player_id: string;
    hole: number;
    distance_m: unknown;
    position: unknown;
  }>;
  const players = orThrow(playersResult.data, playersResult.error, "Kunde inte hämta spelare") as Array<{
    id: string;
    name: string;
  }>;
  const nameById = new Map(players.map((player) => [player.id, player.name]));

  return rows.map((row) => ({
    id: row.id,
    player_id: row.player_id,
    player_name: nameById.get(row.player_id) ?? "Okänd",
    hole: row.hole,
    distance_m: toNumber(row.distance_m),
    position: toNumber(row.position),
  }));
}

/** Best single result recorded across the whole tour — the "current champion" badge. */
async function getBestAwardEntry(
  tourId: string,
  kind: AwardKind
): Promise<LongestDriveWithPlayer | ClosestToPinWithPlayer | undefined> {
  const supabase = getServerSupabase();
  const [awardsResult, playersResult, roundsResult] = await Promise.all([
    supabase
      .from(awardView(kind))
      .select("*")
      .eq("tour_id", tourId)
      .eq("position", 1)
      .order("distance_m", { ascending: kind === "closest_to_pin" }),
    supabase.from("players").select("id, name"),
    supabase.from("rounds").select("id, course_name").eq("tour_id", tourId),
  ]);

  const rows = orThrow(awardsResult.data, awardsResult.error, `Kunde inte hämta ${kind}`) as Array<{
    id: string;
    round_id: string;
    player_id: string;
    tour_id: string;
    hole: number;
    distance_m: unknown;
    position: unknown;
  }>;
  if (rows.length === 0) return undefined;

  const players = orThrow(playersResult.data, playersResult.error, "Kunde inte hämta spelare") as Array<{
    id: string;
    name: string;
  }>;
  const rounds = orThrow(roundsResult.data, roundsResult.error, "Kunde inte hämta ronder") as Array<{
    id: string;
    course_name: string;
  }>;
  const nameById = new Map(players.map((player) => [player.id, player.name]));
  const courseById = new Map(rounds.map((round) => [round.id, round.course_name]));

  const best = rows[0]!;
  return {
    id: best.id,
    round_id: best.round_id,
    player_id: best.player_id,
    tour_id: best.tour_id,
    hole: best.hole,
    distance_m: toNumber(best.distance_m),
    position: toNumber(best.position),
    player_name: nameById.get(best.player_id) ?? "Okänd",
    course_name: courseById.get(best.round_id) ?? "",
  };
}

export function getLongestDriveLeader(tourId: string) {
  return getBestAwardEntry(tourId, "longest_drive") as Promise<LongestDriveWithPlayer | undefined>;
}

export function getClosestToPinLeader(tourId: string) {
  return getBestAwardEntry(tourId, "closest_to_pin") as Promise<ClosestToPinWithPlayer | undefined>;
}

/** Every round's winner (position 1) for one award — the round-by-round breakdown table. */
export async function getRoundAwardWinners(tourId: string, kind: AwardKind): Promise<RoundAwardWinner[]> {
  const supabase = getServerSupabase();
  const [roundsResult, winnersResult, playersResult] = await Promise.all([
    supabase.from("rounds").select("id, course_name").eq("tour_id", tourId).order("sort_order"),
    supabase.from(awardView(kind)).select("*").eq("tour_id", tourId).eq("position", 1),
    supabase.from("players").select("id, name"),
  ]);

  const rounds = orThrow(roundsResult.data, roundsResult.error, "Kunde inte hämta ronder") as Array<{
    id: string;
    course_name: string;
  }>;
  const winners = orThrow(winnersResult.data, winnersResult.error, `Kunde inte hämta ${kind}`) as Array<{
    round_id: string;
    player_id: string;
    hole: number;
    distance_m: unknown;
  }>;
  const players = orThrow(playersResult.data, playersResult.error, "Kunde inte hämta spelare") as Array<{
    id: string;
    name: string;
  }>;
  const nameById = new Map(players.map((player) => [player.id, player.name]));
  const winnerByRound = new Map(winners.map((winner) => [winner.round_id, winner]));

  return rounds.map((round) => {
    const winner = winnerByRound.get(round.id);
    return {
      round_id: round.id,
      course_name: round.course_name,
      player_name: winner ? nameById.get(winner.player_id) ?? "Okänd" : null,
      distance_m: winner ? toNumber(winner.distance_m) : null,
      hole: winner ? winner.hole : null,
    };
  });
}

/** Wins per player for one award (rounds where that player placed 1st) —
 *  the "Segrar denna tour" standings list. */
export async function getAwardWinStandings(
  tourId: string,
  kind: AwardKind
): Promise<Array<{ playerName: string; wins: number }>> {
  const stats = await getPlayerTourStats(tourId);
  const field = kind === "longest_drive" ? "longest_drive_wins" : "closest_to_pin_wins";
  return stats
    .filter((row) => row[field] > 0)
    .map((row) => ({ playerName: row.player_name, wins: row[field] }))
    .sort((a, b) => b.wins - a.wins);
}

// ---------------------------------------------------------------------------
// Yatzy — an unlimited number of games, each scored on the same fixed
// points scale, kept as its own separate totals table.
// ---------------------------------------------------------------------------

export async function getYatzyLeaderboard(tourId: string): Promise<YatzyLeaderboardRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("yatzy_leaderboard")
    .select("*")
    .eq("tour_id", tourId)
    .order("position");
  const rows = orThrow(data, error, "Kunde inte hämta Yatzy-tabellen") as YatzyLeaderboardRow[];
  return rows.map((row) => ({
    ...row,
    total_points: toNumber(row.total_points),
    games_played: toNumber(row.games_played),
    position: toNumber(row.position),
  }));
}

/** The next game number to register — one past the highest played so far. */
export async function getNextYatzyGameNumber(tourId: string): Promise<number> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("yatzy_scores")
    .select("game_number")
    .eq("tour_id", tourId)
    .order("game_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Kunde inte hämta senaste Yatzy-omgången: ${error.message}`);
  return data ? toNumber(data.game_number) + 1 : 1;
}

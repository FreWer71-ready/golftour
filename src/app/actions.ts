"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { RoundStatus } from "@/lib/types/database";

// Every write in this file goes through the Supabase service role key (never
// exposed to the browser) instead of the public anon key, purely so writes
// aren't subject to the same RLS policies as public reads. There's no PIN or
// login gate: anyone with the app's link can register results, at any time —
// that's the point, for a small private group trip.

export type ActionResult = { ok: true } | { ok: false; error: string };
export type ActionResultWithId = { ok: true; id: string } | { ok: false; error: string };

function revalidatePublicPages() {
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath("/rounds");
  revalidatePath("/longest-drive");
  revalidatePath("/closest-to-pin");
  revalidatePath("/stats");
  revalidatePath("/scoring");
}

// ---------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------

export interface UpsertRoundInput {
  id?: string;
  tourId: string;
  courseName: string;
  roundDate: string;
  teeTime: string | null;
  status: RoundStatus;
  sortOrder: number;
}

export async function upsertRound(input: UpsertRoundInput): Promise<ActionResultWithId> {
  const supabase = getAdminSupabase();

  const row = {
    tour_id: input.tourId,
    course_name: input.courseName,
    round_date: input.roundDate,
    tee_time: input.teeTime,
    status: input.status,
    sort_order: input.sortOrder,
  };

  const { data, error } = input.id
    ? await supabase.from("rounds").update(row).eq("id", input.id).select("id").single()
    : await supabase.from("rounds").insert(row).select("id").single();

  if (error || !data) return { ok: false, error: error?.message ?? "Kunde inte spara ronden." };
  revalidatePublicPages();
  return { ok: true, id: data.id as string };
}

// ---------------------------------------------------------------------------
// Scores — gross strokes + handicap in, net strokes is what counts as the result.
// ---------------------------------------------------------------------------

export interface ScoreEntryInput {
  playerId: string;
  grossScore: number;
  handicapStrokes: number;
}

export async function saveRoundScores(
  roundId: string,
  entries: ScoreEntryInput[],
  markCompleted: boolean
): Promise<ActionResult> {
  if (entries.length === 0) return { ok: false, error: "Inga resultat att spara." };
  for (const entry of entries) {
    if (!Number.isInteger(entry.grossScore) || entry.grossScore <= 0) {
      return { ok: false, error: "Bruttoslag måste vara ett positivt heltal." };
    }
    if (!Number.isInteger(entry.handicapStrokes) || entry.handicapStrokes < 0) {
      return { ok: false, error: "Handikap kan inte vara negativt." };
    }
  }

  const supabase = getAdminSupabase();
  const { error } = await supabase.from("round_scores").upsert(
    entries.map((entry) => ({
      round_id: roundId,
      player_id: entry.playerId,
      gross_score: entry.grossScore,
      handicap_strokes: entry.handicapStrokes,
    })),
    { onConflict: "round_id,player_id" }
  );
  if (error) return { ok: false, error: error.message };

  if (markCompleted) {
    const { error: statusError } = await supabase
      .from("rounds")
      .update({ status: "completed" })
      .eq("id", roundId);
    if (statusError) return { ok: false, error: statusError.message };
  }

  revalidatePublicPages();
  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Longest drive / closest to pin
// ---------------------------------------------------------------------------

export async function recordLongestDrive(
  roundId: string,
  playerId: string,
  hole: number,
  distanceM: number | null
): Promise<ActionResult> {
  if (hole < 1 || hole > 18) return { ok: false, error: "Hål måste vara mellan 1 och 18." };

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("longest_drive")
    .insert({ round_id: roundId, player_id: playerId, hole, distance_m: distanceM });
  if (error) return { ok: false, error: error.message };

  revalidatePublicPages();
  return { ok: true };
}

export async function recordClosestToPin(
  roundId: string,
  playerId: string,
  hole: number,
  distanceM: number | null
): Promise<ActionResult> {
  if (hole < 1 || hole > 18) return { ok: false, error: "Hål måste vara mellan 1 och 18." };

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("closest_to_pin")
    .insert({ round_id: roundId, player_id: playerId, hole, distance_m: distanceM });
  if (error) return { ok: false, error: error.message };

  revalidatePublicPages();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Scoring rules
// ---------------------------------------------------------------------------

export async function updateScoringRules(
  tourId: string,
  entries: Array<{ position: number; points: number }>
): Promise<ActionResult> {
  for (const entry of entries) {
    if (!Number.isInteger(entry.points) || entry.points < 0) {
      return { ok: false, error: `Ogiltigt poängvärde för placering ${entry.position}.` };
    }
  }

  const supabase = getAdminSupabase();
  const { error: deleteError } = await supabase.from("scoring_rules").delete().eq("tour_id", tourId);
  if (deleteError) return { ok: false, error: deleteError.message };

  if (entries.length > 0) {
    const { error: insertError } = await supabase
      .from("scoring_rules")
      .insert(entries.map((entry) => ({ tour_id: tourId, position: entry.position, points: entry.points })));
    if (insertError) return { ok: false, error: insertError.message };
  }

  revalidatePublicPages();
  return { ok: true };
}

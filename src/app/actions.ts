"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { AwardKind, RoundStatus } from "@/lib/types/database";

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
  revalidatePath("/points");
  revalidatePath("/rounds");
  revalidatePath("/longest-drive");
  revalidatePath("/closest-to-pin");
  revalidatePath("/stats");
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
// Longest drive / closest to pin — one shared hole per round, one measured
// result per player. Ranked automatically (longest/closest wins) and paid
// out on the same fixed 10/8/6/4/2 points scale as the rounds themselves.
// ---------------------------------------------------------------------------

export interface AwardEntryInput {
  playerId: string;
  distanceM: number;
}

export async function saveRoundAwards(
  kind: AwardKind,
  roundId: string,
  hole: number,
  entries: AwardEntryInput[]
): Promise<ActionResult> {
  if (hole < 1 || hole > 18) return { ok: false, error: "Hål måste vara mellan 1 och 18." };
  if (entries.length === 0) return { ok: false, error: "Inga resultat att spara." };
  for (const entry of entries) {
    if (!Number.isFinite(entry.distanceM) || entry.distanceM <= 0) {
      return { ok: false, error: "Längd/avstånd måste vara ett positivt tal." };
    }
  }

  const supabase = getAdminSupabase();
  const { error } = await supabase.from(kind).upsert(
    entries.map((entry) => ({
      round_id: roundId,
      player_id: entry.playerId,
      hole,
      distance_m: entry.distanceM,
    })),
    { onConflict: "round_id,player_id" }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePublicPages();
  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

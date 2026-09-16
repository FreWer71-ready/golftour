"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/require-admin";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, pinMatches } from "@/lib/admin/session";
import type { RoundStatus } from "@/lib/types/database";

export type ActionResult = { ok: true } | { ok: false; error: string };

const SESSION_EXPIRED: ActionResult = {
  ok: false,
  error: "Admin-sessionen har gått ut. Gå till /admin och ange PIN-koden igen.",
};

/** Guards every mutating action. Returns an error result instead of throwing, so an
 *  expired session becomes a normal on-screen message rather than a crashed request. */
function ensureAdmin(): ActionResult | null {
  return isAdmin() ? null : SESSION_EXPIRED;
}

function revalidatePublicPages() {
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath("/rounds");
  revalidatePath("/longest-drive");
  revalidatePath("/closest-to-pin");
  revalidatePath("/stats");
}

// ---------------------------------------------------------------------------
// Admin session
// ---------------------------------------------------------------------------

export async function verifyPin(pin: string): Promise<ActionResult> {
  const expectedPin = process.env.ADMIN_PIN;
  if (!expectedPin) {
    return { ok: false, error: "ADMIN_PIN är inte konfigurerad på servern." };
  }
  if (!pinMatches(pin, expectedPin)) {
    return { ok: false, error: "Fel PIN-kod." };
  }

  const { token, expiresAt } = createAdminSessionToken();
  cookies().set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return { ok: true };
}

export async function logoutAdmin(): Promise<void> {
  cookies().delete(ADMIN_SESSION_COOKIE);
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

export async function upsertRound(input: UpsertRoundInput): Promise<ActionResult> {
  const guard = ensureAdmin();
  if (guard) return guard;
  const supabase = getAdminSupabase();

  const row = {
    tour_id: input.tourId,
    course_name: input.courseName,
    round_date: input.roundDate,
    tee_time: input.teeTime,
    status: input.status,
    sort_order: input.sortOrder,
  };

  const { error } = input.id
    ? await supabase.from("rounds").update(row).eq("id", input.id)
    : await supabase.from("rounds").insert(row);

  if (error) return { ok: false, error: error.message };
  revalidatePublicPages();
  revalidatePath("/admin/rounds");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Scores
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
  const guard = ensureAdmin();
  if (guard) return guard;
  if (entries.length === 0) return { ok: false, error: "Inga resultat att spara." };
  for (const entry of entries) {
    if (!Number.isInteger(entry.grossScore) || entry.grossScore <= 0) {
      return { ok: false, error: "Bruttoscore måste vara ett positivt heltal." };
    }
    if (!Number.isInteger(entry.handicapStrokes) || entry.handicapStrokes < 0) {
      return { ok: false, error: "Handicap-slag kan inte vara negativt." };
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
  revalidatePath("/admin/rounds");
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
  const guard = ensureAdmin();
  if (guard) return guard;
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
  const guard = ensureAdmin();
  if (guard) return guard;
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
  const guard = ensureAdmin();
  if (guard) return guard;
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
  revalidatePath("/admin/scoring");
  return { ok: true };
}

import Link from "next/link";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Leaderboard } from "@/components/Leaderboard";
import { Card, CardLabel, CardSub, CardValue, BadgeFrame } from "@/components/ui/Card";
import {
  getActiveTour,
  getClosestToPinBoard,
  getLongestDriveBoard,
  getRoundScores,
  getRounds,
  getTourLeaderboard,
} from "@/lib/queries";
import { formatDistance, formatRoundDate, formatTeeTime } from "@/lib/format";

export default async function DashboardPage() {
  const tour = await getActiveTour();
  if (!tour) {
    return (
      <div className="mx-auto max-w-sm px-4 pt-14 text-center text-ink-soft">
        Ingen aktiv tour är konfigurerad än. Skapa en i Supabase, eller kör{" "}
        <code>supabase/migrations/0002_seed.sql</code>.
      </div>
    );
  }

  const [rounds, leaderboard, longestDrives, closestToPins] = await Promise.all([
    getRounds(tour.id),
    getTourLeaderboard(tour.id),
    getLongestDriveBoard(tour.id),
    getClosestToPinBoard(tour.id),
  ]);

  const nextRound = rounds.find((round) => round.status === "upcoming");
  const lastCompleted = [...rounds].reverse().find((round) => round.status === "completed");
  const lastCompletedWinner = lastCompleted ? (await getRoundScores(lastCompleted.id))[0] : null;

  const ldLeader = longestDrives[0];
  const ctpLeader = closestToPins[0];

  const dateRange = `${formatRoundDate(tour.start_date)} – ${formatRoundDate(tour.end_date)}${
    tour.location ? ` · ${tour.location}` : ""
  }`;

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow={dateRange} title={tour.name} />

      <Card>
        <CardLabel>Total leaderboard</CardLabel>
        <div className="mt-2">
          <Leaderboard rows={leaderboard} limit={3} />
        </div>
        {leaderboard.length > 3 && (
          <Link href="/leaderboard" className="mt-2 block text-sm text-ink-soft">
            Visa alla {leaderboard.length} →
          </Link>
        )}
      </Card>

      {nextRound && (
        <Card>
          <CardLabel>Nästa rond</CardLabel>
          <CardValue>{nextRound.course_name}</CardValue>
          <CardSub>
            {formatRoundDate(nextRound.round_date)}
            {nextRound.tee_time ? ` · Tee ${formatTeeTime(nextRound.tee_time)}` : ""}
          </CardSub>
        </Card>
      )}

      {lastCompleted && lastCompletedWinner && (
        <Card>
          <CardLabel>Senaste resultat</CardLabel>
          <CardValue>{lastCompleted.course_name}</CardValue>
          <CardSub>
            Vinnare (netto): {lastCompletedWinner.player_name}, {lastCompletedWinner.net_score}
          </CardSub>
        </Card>
      )}

      {ldLeader && (
        <BadgeFrame className="mb-3 p-3">
          <CardLabel>Longest Drive-ledare</CardLabel>
          <CardValue compact>
            {ldLeader.player_name} · Hål {ldLeader.hole}
            {ldLeader.distance_m !== null ? ` · ${formatDistance(ldLeader.distance_m)}` : ""}
          </CardValue>
        </BadgeFrame>
      )}

      {ctpLeader && (
        <BadgeFrame className="mb-3 p-3">
          <CardLabel>Closest to Pin-ledare</CardLabel>
          <CardValue compact>
            {ctpLeader.player_name} · Hål {ctpLeader.hole}
            {ctpLeader.distance_m !== null ? ` · ${formatDistance(ctpLeader.distance_m)}` : ""}
          </CardValue>
        </BadgeFrame>
      )}
    </div>
  );
}

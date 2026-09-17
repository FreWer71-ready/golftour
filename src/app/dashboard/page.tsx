import Link from "next/link";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Leaderboard } from "@/components/Leaderboard";
import { LiveAwardsTable } from "@/components/LiveAwardsTable";
import { Card, CardLabel, CardSub, CardValue } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  getActiveTour,
  getClosestToPinBoard,
  getLongestDriveBoard,
  getRounds,
  getTourLeaderboard,
} from "@/lib/queries";
import { formatRoundDate, formatTeeTime } from "@/lib/format";
import { ROUND_STATUS_TONE, ROUND_STATUS_LABEL } from "@/lib/round-status";

export const dynamic = "force-dynamic";

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

  const ongoingRound = rounds.find((round) => round.status === "ongoing");
  const nextRound = rounds.find((round) => round.status === "upcoming");

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

      {ongoingRound && (
        <Card>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardLabel>Pågående tävling</CardLabel>
              <CardValue>{ongoingRound.course_name}</CardValue>
              <CardSub>
                {formatRoundDate(ongoingRound.round_date)}
                {ongoingRound.tee_time ? ` · Tee ${formatTeeTime(ongoingRound.tee_time)}` : ""}
              </CardSub>
            </div>
            <Chip tone={ROUND_STATUS_TONE.ongoing}>{ROUND_STATUS_LABEL.ongoing}</Chip>
          </div>
          <Link href={`/rounds/${ongoingRound.id}`} className="mt-2 block text-sm text-ink-soft">
            Registrera resultat →
          </Link>
        </Card>
      )}

      <LiveAwardsTable longestDrive={longestDrives[0]} closestToPin={closestToPins[0]} />

      {nextRound && (
        <Card>
          <CardLabel>Nästa tävling</CardLabel>
          <CardValue>{nextRound.course_name}</CardValue>
          <CardSub>
            {formatRoundDate(nextRound.round_date)}
            {nextRound.tee_time ? ` · Tee ${formatTeeTime(nextRound.tee_time)}` : ""}
          </CardSub>
        </Card>
      )}
    </div>
  );
}

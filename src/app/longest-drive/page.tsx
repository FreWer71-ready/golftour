import Link from "next/link";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BadgeFrame, Card, CardLabel, CardSub, CardValue } from "@/components/ui/Card";
import {
  getActiveTour,
  getAwardWinStandings,
  getLongestDriveLeader,
  getRoundAwardWinners,
} from "@/lib/queries";
import { formatDistance } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LongestDrivePage() {
  const tour = await getActiveTour();
  if (!tour) return null;

  const [leader, roundWinners, standings] = await Promise.all([
    getLongestDriveLeader(tour.id),
    getRoundAwardWinners(tour.id, "longest_drive"),
    getAwardWinStandings(tour.id, "longest_drive"),
  ]);

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow="2026 Awards" title="Longest Drive" />

      {leader ? (
        <BadgeFrame className="mb-3 p-3.5">
          <CardLabel>Aktuell segrare</CardLabel>
          <CardValue compact>{leader.player_name}</CardValue>
          <CardSub>
            Hål {leader.hole} · {formatDistance(leader.distance_m)} · {leader.course_name}
          </CardSub>
        </BadgeFrame>
      ) : (
        <p className="mb-4 text-center text-sm text-ink-soft">Ingen Longest Drive registrerad ännu.</p>
      )}

      <Card>
        <CardLabel>Per rond</CardLabel>
        <div className="mt-2">
          {roundWinners.map((round) => (
            <div
              key={round.round_id}
              className="flex items-center gap-2.5 border-b border-line py-2 text-sm last:border-none"
            >
              <div className="flex-1">
                <div className="font-heading font-semibold">{round.course_name}</div>
                <div className="text-[12px] text-ink-soft">
                  {round.player_name ? `Hål ${round.hole}` : "Inte registrerat än"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading font-semibold">{round.player_name ?? "—"}</div>
                {round.distance_m !== null && (
                  <div className="font-data text-[12.5px] text-maroon">{formatDistance(round.distance_m)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {standings.length > 0 && (
        <Card>
          <CardLabel>Segrar denna tour</CardLabel>
          <div className="mt-2">
            {standings.map((row, index) => (
              <div
                key={row.playerName}
                className="flex items-center gap-2.5 border-b border-line py-2 text-sm last:border-none"
              >
                <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-gold font-data text-xs font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 font-heading font-semibold">{row.playerName}</div>
                <div className="font-data font-semibold text-maroon">{row.wins}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p className="mt-2 text-center text-sm text-ink-soft">
        Registrera resultat på respektive rond → <Link href="/rounds" className="underline">Ronder</Link>
      </p>
    </div>
  );
}

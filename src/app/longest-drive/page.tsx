import { ScreenHeader } from "@/components/ScreenHeader";
import { BadgeFrame, Card, CardLabel, CardSub, CardValue } from "@/components/ui/Card";
import { getActiveTour, getLongestDriveBoard } from "@/lib/queries";
import { formatDistance } from "@/lib/format";
import { countWinsByPlayer } from "@/lib/scoring";

export default async function LongestDrivePage() {
  const tour = await getActiveTour();
  const entries = tour ? await getLongestDriveBoard(tour.id) : [];
  const leader = entries[0];
  const standings = countWinsByPlayer(entries);

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow="2026 Awards" title="Longest Drive" />

      {leader ? (
        <BadgeFrame className="mb-3 p-3.5">
          <CardLabel>Aktuell segrare</CardLabel>
          <CardValue compact>{leader.player_name}</CardValue>
          <CardSub>
            Hål {leader.hole}
            {leader.distance_m !== null ? ` · ${formatDistance(leader.distance_m)}` : ""} ·{" "}
            {leader.course_name}
          </CardSub>
        </BadgeFrame>
      ) : (
        <p className="mb-4 text-center text-sm text-ink-soft">Ingen Longest Drive registrerad ännu.</p>
      )}

      {standings.length > 0 && (
        <Card>
          <CardLabel>Segrar denna tour</CardLabel>
          <div className="mt-2">
            {standings.map((row, index) => (
              <div key={row.playerName} className="flex items-center gap-2.5 border-b border-line py-2 text-sm last:border-none">
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
    </div>
  );
}

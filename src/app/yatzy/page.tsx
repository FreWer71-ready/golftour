import { ScreenHeader } from "@/components/ScreenHeader";
import { Card, CardLabel } from "@/components/ui/Card";
import { YatzyEntryForm } from "@/components/forms/YatzyEntryForm";
import { getActiveTour, getNextYatzyGameNumber, getPlayers, getYatzyLeaderboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function YatzyPage() {
  const tour = await getActiveTour();
  if (!tour) return null;

  const [leaderboard, players, nextGameNumber] = await Promise.all([
    getYatzyLeaderboard(tour.id),
    getPlayers(),
    getNextYatzyGameNumber(tour.id),
  ]);

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow="Yatzy World Tour" title="Yatzy" />

      <Card>
        <CardLabel>Totaltabell</CardLabel>
        <div className="mt-2">
          {leaderboard.every((row) => row.games_played === 0) ? (
            <p className="text-sm text-ink-soft">Inga omgångar registrerade ännu.</p>
          ) : (
            leaderboard.map((row) => (
              <div
                key={row.player_id}
                className="flex items-center gap-2.5 border-b border-line py-2.5 text-sm last:border-none"
              >
                <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-gold font-data text-xs font-semibold">
                  {row.position}
                </div>
                <div className="flex-1">
                  <div className="font-heading text-[14.5px] font-semibold">{row.player_name}</div>
                  <div className="text-[11.5px] text-ink-soft">{row.games_played} omgångar spelade</div>
                </div>
                <div className="font-data text-[15px] font-semibold text-maroon">{row.total_points} p</div>
              </div>
            ))
          )}
        </div>
      </Card>

      <h2 className="mb-3 mt-6 font-heading text-lg font-semibold">Registrera omgång</h2>
      <p className="mb-3 text-sm text-ink-soft">
        Samma poängskala som resten av touren: 10-8-6-4-2 poäng för plats 1–5.
      </p>
      <YatzyEntryForm tourId={tour.id} players={players} nextGameNumber={nextGameNumber} />
    </div>
  );
}

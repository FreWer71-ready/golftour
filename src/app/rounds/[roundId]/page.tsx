import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Chip } from "@/components/ui/Chip";
import { RoundForm } from "@/components/forms/RoundForm";
import { ScoreEntryForm } from "@/components/forms/ScoreEntryForm";
import { AwardEntryForm } from "@/components/forms/AwardEntryForm";
import { getPlayers, getRound, getRoundAwards, getRoundScores } from "@/lib/queries";
import { formatRoundDate, formatTeeTime } from "@/lib/format";
import { ROUND_STATUS_LABEL, ROUND_STATUS_TONE } from "@/lib/round-status";

export const dynamic = "force-dynamic";

export default async function RoundDetailPage({ params }: { params: { roundId: string } }) {
  const round = await getRound(params.roundId);
  if (!round) notFound();

  const [scores, players, longestDrives, closestToPins] = await Promise.all([
    getRoundScores(round.id),
    getPlayers(),
    getRoundAwards(round.id, "longest_drive"),
    getRoundAwards(round.id, "closest_to_pin"),
  ]);

  return (
    <div className="mx-auto max-w-sm px-4 pt-10 pb-10">
      <ScreenHeader
        eyebrow={`${formatRoundDate(round.round_date)}${
          round.tee_time ? ` · Tee ${formatTeeTime(round.tee_time)}` : ""
        }`}
        title={round.course_name}
      />
      <div className="mb-5 text-center">
        <Chip tone={ROUND_STATUS_TONE[round.status]}>{ROUND_STATUS_LABEL[round.status]}</Chip>
      </div>

      {scores.length > 0 && (
        <table className="mb-8 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="pb-2 text-left font-label text-[10.5px] uppercase tracking-wide text-maroon">
                Spelare
              </th>
              <th className="pb-2 text-left font-label text-[10.5px] uppercase tracking-wide text-maroon">
                Brutto
              </th>
              <th className="pb-2 text-left font-label text-[10.5px] uppercase tracking-wide text-maroon">
                Handikap
              </th>
              <th className="pb-2 text-left font-label text-[10.5px] uppercase tracking-wide text-maroon">
                Resultat
              </th>
              <th className="pb-2 text-left font-label text-[10.5px] uppercase tracking-wide text-maroon">
                Plac.
              </th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score) => (
              <tr key={score.id} className="border-b border-line">
                <td className="py-2 font-heading">{score.player_name}</td>
                <td className="py-2 font-data font-semibold tabular-nums">{score.gross_score}</td>
                <td className="py-2 font-data font-semibold tabular-nums">{score.handicap_strokes}</td>
                <td className="py-2 font-data font-semibold tabular-nums text-maroon">{score.net_score}</td>
                <td className="py-2 font-data font-semibold tabular-nums">{score.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mb-3 font-heading text-lg font-semibold">
        {scores.length > 0 ? "Registrera / ändra resultat" : "Registrera resultat"}
      </h2>
      <p className="mb-3 text-sm text-ink-soft">
        Vem som helst kan lägga in resultat, när som helst. Ange bruttoslag och handikap — resultatet
        (brutto − handikap) är det som räknas i leaderboard.
      </p>
      <ScoreEntryForm roundId={round.id} players={players} existingScores={scores} roundStatus={round.status} />

      <h2 className="mb-3 mt-9 font-heading text-lg font-semibold">Longest Drive</h2>
      <AwardTable entries={longestDrives} unit="m" />
      <AwardEntryForm
        kind="longest_drive"
        roundId={round.id}
        players={players}
        existingEntries={longestDrives}
      />

      <h2 className="mb-3 mt-9 font-heading text-lg font-semibold">Closest to Pin</h2>
      <AwardTable entries={closestToPins} unit="m" />
      <AwardEntryForm
        kind="closest_to_pin"
        roundId={round.id}
        players={players}
        existingEntries={closestToPins}
      />

      <h2 className="mb-3 mt-9 font-heading text-lg font-semibold">Rondinformation</h2>
      <RoundForm tourId={round.tour_id} round={round} nextSortOrder={round.sort_order} />
    </div>
  );
}

function AwardTable({
  entries,
  unit,
}: {
  entries: Array<{ id: string; player_name: string; distance_m: number; position: number }>;
  unit: string;
}) {
  if (entries.length === 0) return null;
  return (
    <table className="mb-4 w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="pb-2 text-left font-label text-[10.5px] uppercase tracking-wide text-maroon">
            Spelare
          </th>
          <th className="pb-2 text-left font-label text-[10.5px] uppercase tracking-wide text-maroon">
            Resultat
          </th>
          <th className="pb-2 text-left font-label text-[10.5px] uppercase tracking-wide text-maroon">
            Plac.
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id} className="border-b border-line">
            <td className="py-2 font-heading">{entry.player_name}</td>
            <td className="py-2 font-data font-semibold tabular-nums text-maroon">
              {entry.distance_m} {unit}
            </td>
            <td className="py-2 font-data font-semibold tabular-nums">{entry.position}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

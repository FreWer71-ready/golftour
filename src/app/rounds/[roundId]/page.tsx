import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getRound, getRoundScores } from "@/lib/queries";
import { formatRoundDate, formatTeeTime } from "@/lib/format";

export default async function RoundDetailPage({ params }: { params: { roundId: string } }) {
  const round = await getRound(params.roundId);
  if (!round) notFound();

  const scores = await getRoundScores(round.id);

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader
        eyebrow={`${formatRoundDate(round.round_date)}${
          round.tee_time ? ` · Tee ${formatTeeTime(round.tee_time)}` : ""
        }`}
        title={round.course_name}
      />

      {scores.length === 0 ? (
        <p className="text-center text-sm text-ink-soft">
          {round.status === "upcoming" ? "Resultat är inte registrerat än." : "Inga resultat registrerade."}
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="pb-2 text-left font-label text-[10.5px] uppercase tracking-wide text-maroon">
                Spelare
              </th>
              <th className="pb-2 text-left font-label text-[10.5px] uppercase tracking-wide text-maroon">
                Brutto
              </th>
              <th className="pb-2 text-left font-label text-[10.5px] uppercase tracking-wide text-maroon">
                Netto
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
                <td className="py-2 font-data font-semibold tabular-nums">{score.net_score}</td>
                <td className="py-2 font-data font-semibold tabular-nums">{score.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

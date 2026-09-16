import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/require-admin";
import { getPlayers, getRound, getRoundScores } from "@/lib/queries";
import { ScreenHeader } from "@/components/ScreenHeader";
import { RoundForm } from "@/components/admin/RoundForm";
import { ScoreEntryForm } from "@/components/admin/ScoreEntryForm";

export default async function AdminRoundEditPage({ params }: { params: { roundId: string } }) {
  requireAdminPage();

  const round = await getRound(params.roundId);
  if (!round) notFound();

  const [players, scores] = await Promise.all([getPlayers(), getRoundScores(round.id)]);

  return (
    <div className="mx-auto max-w-sm px-4 pt-10 pb-10">
      <ScreenHeader eyebrow="Admin" title={round.course_name} />

      <h2 className="mb-3 font-heading text-lg font-semibold">Rondinformation</h2>
      <RoundForm tourId={round.tour_id} round={round} nextSortOrder={round.sort_order} />

      <h2 className="mb-3 mt-8 font-heading text-lg font-semibold">Registrera resultat</h2>
      <ScoreEntryForm roundId={round.id} players={players} existingScores={scores} />
    </div>
  );
}

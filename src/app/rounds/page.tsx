import Link from "next/link";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Chip } from "@/components/ui/Chip";
import { RoundForm } from "@/components/forms/RoundForm";
import { getActiveTour, getRounds } from "@/lib/queries";
import { formatRoundDate, formatTeeTime } from "@/lib/format";
import { ROUND_STATUS_DOT, ROUND_STATUS_LABEL, ROUND_STATUS_TONE } from "@/lib/round-status";

export const dynamic = "force-dynamic";

export default async function RoundsPage() {
  const tour = await getActiveTour();
  const rounds = tour ? await getRounds(tour.id) : [];

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow={`${rounds.length} ronder · en tour`} title="Ronder" />

      <div className="mb-6 space-y-2.5">
        {rounds.map((round) => (
          <Link
            key={round.id}
            href={`/rounds/${round.id}`}
            className="flex items-center gap-2.5 rounded-card border border-line bg-parchment px-3 py-3"
          >
            <span className={`h-2 w-2 flex-none rounded-full ${ROUND_STATUS_DOT[round.status]}`} />
            <span className="flex-1">
              <span className="block font-heading text-[14.5px] font-semibold">{round.course_name}</span>
              <span className="mt-0.5 block text-[12.5px] text-ink-soft">
                {formatRoundDate(round.round_date)}
                {round.tee_time ? ` · Tee ${formatTeeTime(round.tee_time)}` : ""}
              </span>
            </span>
            <Chip tone={ROUND_STATUS_TONE[round.status]}>{ROUND_STATUS_LABEL[round.status]}</Chip>
          </Link>
        ))}
        {rounds.length === 0 && <p className="text-sm text-ink-soft">Inga ronder inlagda ännu.</p>}
      </div>

      {tour && (
        <>
          <h2 className="mb-3 font-heading text-lg font-semibold">Ny rond</h2>
          <RoundForm tourId={tour.id} nextSortOrder={rounds.length + 1} />
        </>
      )}
    </div>
  );
}

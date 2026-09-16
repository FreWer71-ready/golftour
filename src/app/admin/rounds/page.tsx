import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/require-admin";
import { getActiveTour, getRounds } from "@/lib/queries";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Chip } from "@/components/ui/Chip";
import { RoundForm } from "@/components/admin/RoundForm";
import { formatRoundDate, formatTeeTime } from "@/lib/format";

export default async function AdminRoundsPage() {
  requireAdminPage();

  const tour = await getActiveTour();
  if (!tour) {
    return <p className="mx-auto max-w-sm px-4 pt-10 text-center text-ink-soft">Ingen aktiv tour hittades.</p>;
  }
  const rounds = await getRounds(tour.id);

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow="Admin" title="Ronder" />

      <div className="mb-6 space-y-2.5">
        {rounds.map((round) => (
          <Link
            key={round.id}
            href={`/admin/rounds/${round.id}`}
            className="flex items-center gap-2.5 rounded-card border border-line bg-parchment px-3 py-3"
          >
            <span className="flex-1">
              <span className="block font-heading text-[14.5px] font-semibold">{round.course_name}</span>
              <span className="mt-0.5 block text-[12.5px] text-ink-soft">
                {formatRoundDate(round.round_date)}
                {round.tee_time ? ` · Tee ${formatTeeTime(round.tee_time)}` : ""}
              </span>
            </span>
            <Chip active={round.status === "completed"}>
              {round.status === "completed" ? "Spelad" : "Kommande"}
            </Chip>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 font-heading text-lg font-semibold">Ny rond</h2>
      <RoundForm tourId={tour.id} nextSortOrder={rounds.length + 1} />
    </div>
  );
}

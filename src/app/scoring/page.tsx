import { getActiveTour, getScoringRules } from "@/lib/queries";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScoringForm } from "@/components/forms/ScoringForm";

export const dynamic = "force-dynamic";

export default async function ScoringPage() {
  const tour = await getActiveTour();
  if (!tour) return null;

  const rules = await getScoringRules(tour.id);

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow="Ronder" title="Poängsystem" />
      <p className="mb-4 text-sm text-ink-soft">
        Poäng per placering i varje rond. Summeras till Totalpoäng på Statistik-sidan.
      </p>
      <ScoringForm tourId={tour.id} rules={rules} />
    </div>
  );
}

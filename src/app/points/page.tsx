import { ScreenHeader } from "@/components/ScreenHeader";
import { PointsLeaderboard } from "@/components/PointsLeaderboard";
import { getActiveTour, getPointsLeaderboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PointsPage() {
  const tour = await getActiveTour();
  const rows = tour ? await getPointsLeaderboard(tour.id) : [];

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow={tour?.name ?? ""} title="Poängtävling" />
      <p className="mb-4 text-center text-sm text-ink-soft">
        10 · 8 · 6 · 4 · 2 poäng för plats 1–5, i varje rond och varje rondens Longest Drive och
        Closest to Pin.
      </p>
      <PointsLeaderboard rows={rows} />
    </div>
  );
}

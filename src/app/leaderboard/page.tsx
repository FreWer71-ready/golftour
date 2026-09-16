import { ScreenHeader } from "@/components/ScreenHeader";
import { Leaderboard } from "@/components/Leaderboard";
import { getActiveTour, getTourLeaderboard } from "@/lib/queries";

export default async function LeaderboardPage() {
  const tour = await getActiveTour();
  const rows = tour ? await getTourLeaderboard(tour.id) : [];

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow={tour?.name ?? ""} title="Total leaderboard" />
      <Leaderboard rows={rows} />
    </div>
  );
}

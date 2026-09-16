import { StatsView } from "@/components/StatsView";
import { getActiveTour, getPlayerTourStats, getRounds } from "@/lib/queries";

export default async function StatsPage() {
  const tour = await getActiveTour();
  if (!tour) return null;

  const [stats, rounds] = await Promise.all([getPlayerTourStats(tour.id), getRounds(tour.id)]);

  return <StatsView stats={stats} roundsInTour={rounds.length} />;
}

import { requireAdminPage } from "@/lib/admin/require-admin";
import { getActiveTour, getPlayers, getRounds } from "@/lib/queries";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AwardForm } from "@/components/admin/AwardForm";

export default async function AdminClosestToPinPage() {
  requireAdminPage();
  const tour = await getActiveTour();
  if (!tour) return null;

  const [rounds, players] = await Promise.all([getRounds(tour.id), getPlayers()]);

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow="Admin · 2026 Awards" title="Closest to Pin" />
      <AwardForm kind="closest-to-pin" rounds={rounds} players={players} />
    </div>
  );
}

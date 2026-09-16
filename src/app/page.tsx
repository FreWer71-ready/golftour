import { PlayerPicker } from "@/components/PlayerPicker";
import { getPlayers } from "@/lib/queries";

// Always fetch fresh from Supabase — never statically prerendered/cached at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const players = await getPlayers();
  return <PlayerPicker players={players} />;
}

import { PlayerPicker } from "@/components/PlayerPicker";
import { getPlayers } from "@/lib/queries";

export default async function HomePage() {
  const players = await getPlayers();
  return <PlayerPicker players={players} />;
}

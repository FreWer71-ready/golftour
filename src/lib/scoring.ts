/** Pure helpers, kept free of Supabase/Next imports so they're trivial to unit test. */

export function countWinsByPlayer(
  entries: Array<{ player_name: string }>
): Array<{ playerName: string; wins: number }> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.player_name, (counts.get(entry.player_name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([playerName, wins]) => ({ playerName, wins }))
    .sort((a, b) => b.wins - a.wins);
}

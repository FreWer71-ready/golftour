import type { TourLeaderboardRow } from "@/lib/types/database";
import { formatScoreDelta } from "@/lib/format";

export function Leaderboard({
  rows,
  highlightPlayer,
  limit,
}: {
  rows: TourLeaderboardRow[];
  highlightPlayer?: string | null;
  limit?: number;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-soft">Inga spelade ronder ännu.</p>;
  }

  const leaderTotal = rows[0]!.total_net;
  const visible = limit ? rows.slice(0, limit) : rows;

  return (
    <div>
      {visible.map((row) => (
        <div
          key={row.player_id}
          className={`flex items-center gap-2.5 border-b border-line py-2.5 text-sm last:border-none ${
            row.player_name === highlightPlayer ? "font-semibold" : ""
          }`}
        >
          <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-gold font-data text-xs font-semibold">
            {row.position}
          </div>
          <div className="flex-1 font-heading text-[14.5px] font-semibold">{row.player_name}</div>
          <div className="font-data text-[15px] font-semibold text-maroon">{row.total_net}</div>
          <div className="w-auto flex-none whitespace-nowrap font-data text-[11.5px] text-ink-soft">
            {formatScoreDelta(row.total_net, leaderTotal)}
          </div>
        </div>
      ))}
    </div>
  );
}

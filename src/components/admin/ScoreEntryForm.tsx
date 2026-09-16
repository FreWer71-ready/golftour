"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveRoundScores } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import type { Player, RoundScoreWithPlayer } from "@/lib/types/database";

type Row = { grossScore: string; handicapStrokes: string };

export function ScoreEntryForm({
  roundId,
  players,
  existingScores,
}: {
  roundId: string;
  players: Player[];
  existingScores: RoundScoreWithPlayer[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, Row>>(() => {
    const initial: Record<string, Row> = {};
    for (const player of players) {
      const existing = existingScores.find((score) => score.player_id === player.id);
      initial[player.id] = {
        grossScore: existing ? String(existing.gross_score) : "",
        handicapStrokes: existing ? String(existing.handicap_strokes) : "0",
      };
    }
    return initial;
  });
  const [markCompleted, setMarkCompleted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(playerId: string, field: keyof Row, value: string) {
    setRows((current) => ({ ...current, [playerId]: { ...current[playerId]!, [field]: value } }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const entries = players
      .filter((player) => rows[player.id]?.grossScore.trim())
      .map((player) => ({
        playerId: player.id,
        grossScore: Number(rows[player.id]!.grossScore),
        handicapStrokes: Number(rows[player.id]!.handicapStrokes || "0"),
      }));

    startTransition(async () => {
      const result = await saveRoundScores(roundId, entries, markCompleted);
      if (result.ok) {
        router.push(`/rounds/${roundId}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="pb-2 text-left font-label text-[10px] uppercase tracking-wide text-maroon">
              Spelare
            </th>
            <th className="pb-2 text-left font-label text-[10px] uppercase tracking-wide text-maroon">
              Brutto
            </th>
            <th className="pb-2 text-left font-label text-[10px] uppercase tracking-wide text-maroon">
              Hcp
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id} className="border-b border-line">
              <td className="py-2 pr-2 font-heading text-[13.5px]">{player.name}</td>
              <td className="py-2 pr-2">
                <input
                  inputMode="numeric"
                  value={rows[player.id]?.grossScore ?? ""}
                  onChange={(event) => update(player.id, "grossScore", event.target.value)}
                  className="w-16 rounded-lg border border-line bg-paper px-2 py-1.5 font-data text-[14px]"
                />
              </td>
              <td className="py-2">
                <input
                  inputMode="numeric"
                  value={rows[player.id]?.handicapStrokes ?? "0"}
                  onChange={(event) => update(player.id, "handicapStrokes", event.target.value)}
                  className="w-14 rounded-lg border border-line bg-paper px-2 py-1.5 font-data text-[14px]"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={markCompleted}
          onChange={(event) => setMarkCompleted(event.target.checked)}
        />
        Markera ronden som spelad
      </label>

      {error && <p className="text-sm text-maroon">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        Spara resultat
      </Button>
    </form>
  );
}

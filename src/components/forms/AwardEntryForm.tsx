"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveRoundAwards } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import type { AwardKind, Player } from "@/lib/types/database";

const LABELS: Record<AwardKind, { title: string; unit: string; helper: string }> = {
  longest_drive: {
    title: "Longest Drive",
    unit: "Längd (m)",
    helper: "Alla mäts på samma hål — längst slag vinner.",
  },
  closest_to_pin: {
    title: "Closest to Pin",
    unit: "Avstånd (m)",
    helper: "Alla mäts på samma hål — kortast avstånd vinner.",
  },
};

export function AwardEntryForm({
  kind,
  roundId,
  players,
  existingEntries,
}: {
  kind: AwardKind;
  roundId: string;
  players: Player[];
  existingEntries: Array<{ player_id: string; hole: number; distance_m: number }>;
}) {
  const router = useRouter();
  const label = LABELS[kind];
  const [hole, setHole] = useState(String(existingEntries[0]?.hole ?? 1));
  const [distances, setDistances] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const player of players) {
      const existing = existingEntries.find((entry) => entry.player_id === player.id);
      initial[player.id] = existing ? String(existing.distance_m) : "";
    }
    return initial;
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const entries = players
      .filter((player) => distances[player.id]?.trim())
      .map((player) => ({
        playerId: player.id,
        distanceM: Number(distances[player.id]!.replace(",", ".")),
      }));

    startTransition(async () => {
      const result = await saveRoundAwards(kind, roundId, Number(hole), entries);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block font-label text-[11px] uppercase tracking-wide text-ink-soft">
          Hål (samma för alla)
        </span>
        <input
          required
          inputMode="numeric"
          value={hole}
          onChange={(event) => setHole(event.target.value)}
          className="w-24 rounded-lg border border-line bg-paper px-3 py-2 font-data text-[14.5px]"
        />
      </label>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="pb-2 text-left font-label text-[10px] uppercase tracking-wide text-maroon">
              Spelare
            </th>
            <th className="pb-2 text-left font-label text-[10px] uppercase tracking-wide text-maroon">
              {label.unit}
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id} className="border-b border-line">
              <td className="py-2 pr-2 font-heading text-[13.5px]">{player.name}</td>
              <td className="py-2">
                <input
                  inputMode="decimal"
                  placeholder="t.ex. 245"
                  value={distances[player.id] ?? ""}
                  onChange={(event) =>
                    setDistances((current) => ({ ...current, [player.id]: event.target.value }))
                  }
                  className="w-24 rounded-lg border border-line bg-paper px-2 py-1.5 font-data text-[14px]"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-ink-soft">{label.helper}</p>

      {error && <p className="text-sm text-maroon">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        Spara {label.title}
      </Button>
    </form>
  );
}

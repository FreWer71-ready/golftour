"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveYatzyGame } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import type { Player } from "@/lib/types/database";

export function YatzyEntryForm({
  tourId,
  players,
  nextGameNumber,
}: {
  tourId: string;
  players: Player[];
  nextGameNumber: number;
}) {
  const router = useRouter();
  const [gameNumber, setGameNumber] = useState(String(nextGameNumber));
  const [scores, setScores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const entries = players
      .filter((player) => scores[player.id]?.trim())
      .map((player) => ({ playerId: player.id, score: Number(scores[player.id]) }));

    startTransition(async () => {
      const result = await saveYatzyGame(tourId, Number(gameNumber), entries);
      if (result.ok) {
        setScores({});
        setGameNumber(String(Number(gameNumber) + 1));
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
          Omgång
        </span>
        <input
          required
          inputMode="numeric"
          value={gameNumber}
          onChange={(event) => setGameNumber(event.target.value)}
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
              Poäng
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id} className="border-b border-line">
              <td className="py-2 pr-2 font-heading text-[13.5px]">{player.name}</td>
              <td className="py-2">
                <input
                  inputMode="numeric"
                  placeholder="t.ex. 245"
                  value={scores[player.id] ?? ""}
                  onChange={(event) =>
                    setScores((current) => ({ ...current, [player.id]: event.target.value }))
                  }
                  className="w-24 rounded-lg border border-line bg-paper px-2 py-1.5 font-data text-[14px]"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {error && <p className="text-sm text-maroon">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        Spara omgång
      </Button>
    </form>
  );
}

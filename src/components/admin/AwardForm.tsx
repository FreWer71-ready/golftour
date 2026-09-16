"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordClosestToPin, recordLongestDrive } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import type { Player, Round } from "@/lib/types/database";

export function AwardForm({
  kind,
  rounds,
  players,
}: {
  kind: "longest-drive" | "closest-to-pin";
  rounds: Round[];
  players: Player[];
}) {
  const router = useRouter();
  const [roundId, setRoundId] = useState(rounds[0]?.id ?? "");
  const [playerId, setPlayerId] = useState(players[0]?.id ?? "");
  const [hole, setHole] = useState("1");
  const [distance, setDistance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const holeNumber = Number(hole);
    const distanceValue = distance.trim() ? Number(distance.replace(",", ".")) : null;

    startTransition(async () => {
      const action = kind === "longest-drive" ? recordLongestDrive : recordClosestToPin;
      const result = await action(roundId, playerId, holeNumber, distanceValue);
      if (result.ok) {
        router.push(kind === "longest-drive" ? "/longest-drive" : "/closest-to-pin");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Rond">
        <select
          value={roundId}
          onChange={(event) => setRoundId(event.target.value)}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-body text-[14.5px]"
        >
          {rounds.map((round) => (
            <option key={round.id} value={round.id}>
              {round.course_name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Hål">
        <input
          required
          inputMode="numeric"
          value={hole}
          onChange={(event) => setHole(event.target.value)}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-data text-[14.5px]"
        />
      </Field>
      <Field label="Vinnare">
        <select
          value={playerId}
          onChange={(event) => setPlayerId(event.target.value)}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-body text-[14.5px]"
        >
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={kind === "longest-drive" ? "Längd, meter (valfritt)" : "Avstånd, meter (valfritt)"}>
        <input
          inputMode="decimal"
          placeholder="t.ex. 2,4"
          value={distance}
          onChange={(event) => setDistance(event.target.value)}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-data text-[14.5px]"
        />
      </Field>

      {error && <p className="text-sm text-maroon">{error}</p>}

      <Button type="submit" disabled={pending || !roundId || !playerId} className="w-full">
        Registrera
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-label text-[11px] uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      {children}
    </label>
  );
}

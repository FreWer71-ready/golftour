"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateScoringRules } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import type { ScoringRule } from "@/lib/types/database";

const POSITIONS = Array.from({ length: 10 }, (_, index) => index + 1);

export function ScoringForm({ tourId, rules }: { tourId: string; rules: ScoringRule[] }) {
  const router = useRouter();
  const [points, setPoints] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const position of POSITIONS) {
      const rule = rules.find((r) => r.position === position);
      initial[position] = rule ? String(rule.points) : "0";
    }
    return initial;
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const entries = POSITIONS.map((position) => ({ position, points: Number(points[position] ?? "0") }));

    startTransition(async () => {
      const result = await updateScoringRules(tourId, entries);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2.5">
      {POSITIONS.map((position) => (
        <div key={position} className="flex items-center gap-3">
          <span className="w-16 font-heading text-[14.5px] font-semibold">Plac. {position}</span>
          <input
            inputMode="numeric"
            value={points[position] ?? "0"}
            onChange={(event) => setPoints((current) => ({ ...current, [position]: event.target.value }))}
            className="w-20 rounded-lg border border-line bg-paper px-3 py-2 font-data text-[14.5px]"
          />
          <span className="text-sm text-ink-soft">poäng</span>
        </div>
      ))}

      {error && <p className="text-sm text-maroon">{error}</p>}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        Spara poängsystem
      </Button>
    </form>
  );
}

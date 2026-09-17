"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card, CardLabel, CardSub, CardValue } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { usePlayerName } from "@/lib/use-player";
import { formatDistance } from "@/lib/format";
import type { PlayerTourStats } from "@/lib/types/database";

export function StatsView({ stats, roundsInTour }: { stats: PlayerTourStats[]; roundsInTour: number }) {
  const { name } = usePlayerName();
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    if (selectedName) return;
    if (name && stats.some((row) => row.player_name === name)) {
      setSelectedName(name);
    } else if (stats[0]) {
      setSelectedName(stats[0].player_name);
    }
  }, [name, stats, selectedName]);

  const selected = stats.find((row) => row.player_name === selectedName) ?? stats[0];

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow="Spelare" title="Statistik" />

      <div className="mb-4 flex flex-wrap gap-2">
        {stats.map((row) => (
          <button key={row.player_id} onClick={() => setSelectedName(row.player_name)}>
            <Chip active={row.player_name === selectedName}>{row.player_name}</Chip>
          </button>
        ))}
      </div>

      {selected ? (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile value={selected.total_points} label="Totalpoäng" />
            <StatTile value={selected.rounds_won} label="Vunna rundor" />
            <StatTile value={formatDistance(selected.longest_drive_best_m) ?? "–"} label="Bästa Longest Drive" />
            <StatTile
              value={formatDistance(selected.closest_to_pin_best_m) ?? "–"}
              label="Bästa Closest to Pin"
            />
          </div>
          <Link href="/points" className="mt-3 block text-center text-sm text-ink-soft underline">
            Visa hela poängtävlingen →
          </Link>
          <Card className="mt-3">
            <CardLabel>Snittplacering</CardLabel>
            <CardValue>{selected.avg_position ?? "–"}</CardValue>
            <CardSub>
              Efter {selected.rounds_played} av {roundsInTour} ronder
            </CardSub>
          </Card>
        </>
      ) : (
        <p className="text-sm text-ink-soft">Ingen statistik tillgänglig ännu.</p>
      )}
    </div>
  );
}

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-card border border-line bg-parchment p-3.5 text-center">
      <div className="font-data text-[27px] font-bold text-maroon">{value}</div>
      <div className="mt-1 font-label text-[10.5px] uppercase tracking-wide text-ink-soft">{label}</div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredPlayerName, setStoredPlayerName } from "@/lib/player";
import type { Player } from "@/lib/types/database";

export function PlayerPicker({ players }: { players: Player[] }) {
  const router = useRouter();
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    const existing = getStoredPlayerName();
    if (existing) {
      router.replace("/dashboard");
      return;
    }
    setCheckedStorage(true);
  }, [router]);

  function choose(name: string) {
    setStoredPlayerName(name);
    router.replace("/dashboard");
  }

  if (!checkedStorage) return null;

  return (
    <div className="mx-auto max-w-sm px-4 pt-14">
      <div className="text-center text-gold-bright tracking-[0.4em] text-xs">★ ★ ★ ★ ★</div>
      <h1 className="mt-3 text-center font-display text-[32px] text-ink">Vem är du?</h1>
      <p className="mt-2 text-center font-label text-xs uppercase tracking-wide text-maroon">
        Börs · Birdies · Bärs
      </p>

      <div className="mt-8 space-y-2.5">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => choose(player.name)}
            className="flex w-full items-center gap-3 rounded-card border border-gold bg-parchment px-4 py-3.5 text-left"
          >
            <span
              aria-hidden
              className="h-4 w-4 flex-none rounded-full border border-gold"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, var(--color-paper), var(--color-parchment))",
              }}
            />
            <span className="flex-1 font-heading text-base font-semibold">{player.name}</span>
            <span className="text-gold">›</span>
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Ditt val sparas i den här webbläsaren — du väljer bara en gång.
      </p>
    </div>
  );
}

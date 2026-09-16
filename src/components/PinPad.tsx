"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { verifyPin } from "@/app/admin/actions";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"] as const;
const MAX_LENGTH = 8;

export function PinPad() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(candidate: string) {
    if (candidate.length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await verifyPin(candidate);
      if (result.ok) {
        router.push("/admin/panel");
      } else {
        setError(result.error);
        setPin("");
      }
    });
  }

  function press(key: (typeof KEYS)[number]) {
    if (pending) return;
    if (key === "⌫") {
      setPin((current) => current.slice(0, -1));
      return;
    }
    if (key === "✓") {
      submit(pin);
      return;
    }
    setPin((current) => (current.length < MAX_LENGTH ? current + key : current));
  }

  return (
    <div className="mx-auto max-w-xs px-4 pt-14 text-center">
      <div className="text-gold tracking-[0.4em] text-xs">★ ★ ★ ★ ★</div>
      <h1 className="mt-3 font-display text-[28px] text-ink">Admin-läge</h1>
      <p className="mt-2 text-sm text-ink-soft">Ange PIN-koden för att registrera resultat</p>

      <div className="my-7 flex min-h-[14px] justify-center gap-2.5" aria-live="polite">
        {pin.length === 0 ? (
          <span className="text-sm text-ink-soft">&nbsp;</span>
        ) : (
          Array.from({ length: pin.length }).map((_, index) => (
            <span key={index} className="h-3.5 w-3.5 rounded-full border border-gold bg-gold" />
          ))
        )}
      </div>

      {error && <p className="mb-4 text-sm text-maroon">{error}</p>}

      <div className="grid grid-cols-3 gap-2.5">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            disabled={pending}
            aria-label={key === "✓" ? "Bekräfta" : key === "⌫" ? "Radera" : key}
            className="aspect-square rounded-full border border-line bg-parchment font-heading text-lg disabled:opacity-50"
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}

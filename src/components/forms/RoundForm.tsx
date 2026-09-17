"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { upsertRound } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import type { Round, RoundStatus } from "@/lib/types/database";

export function RoundForm({
  tourId,
  round,
  nextSortOrder,
}: {
  tourId: string;
  round?: Round;
  nextSortOrder: number;
}) {
  const router = useRouter();
  const [courseName, setCourseName] = useState(round?.course_name ?? "");
  const [roundDate, setRoundDate] = useState(round?.round_date ?? "");
  const [teeTime, setTeeTime] = useState(round?.tee_time?.slice(0, 5) ?? "");
  const [status, setStatus] = useState<RoundStatus>(round?.status ?? "upcoming");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await upsertRound({
        id: round?.id,
        tourId,
        courseName,
        roundDate,
        teeTime: teeTime || null,
        status,
        sortOrder: round?.sort_order ?? nextSortOrder,
      });
      if (result.ok) {
        if (round) {
          router.refresh();
        } else {
          // New round — jump straight to it so results can be added right away.
          router.push(`/rounds/${result.id}`);
        }
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Bana">
        <input
          required
          value={courseName}
          onChange={(event) => setCourseName(event.target.value)}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-body text-[14.5px] text-ink"
        />
      </Field>
      <Field label="Datum">
        <input
          required
          type="date"
          value={roundDate}
          onChange={(event) => setRoundDate(event.target.value)}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-body text-[14.5px] text-ink"
        />
      </Field>
      <Field label="Tee time (valfritt)">
        <input
          type="time"
          value={teeTime}
          onChange={(event) => setTeeTime(event.target.value)}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-body text-[14.5px] text-ink"
        />
      </Field>
      <Field label="Status">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as RoundStatus)}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-body text-[14.5px] text-ink"
        >
          <option value="upcoming">Kommande</option>
          <option value="ongoing">Pågående</option>
          <option value="completed">Spelad</option>
        </select>
      </Field>

      {error && <p className="text-sm text-maroon">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {round ? "Spara ändringar" : "Skapa rond"}
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

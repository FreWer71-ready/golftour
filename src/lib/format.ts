const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** "2026-09-18" -> "fre 18 sep" */
export function formatRoundDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00`));
}

/** "10:10:00" -> "10:10" */
export function formatTeeTime(time: string | null): string | null {
  if (!time) return null;
  return time.slice(0, 5);
}

export function formatDistance(distanceM: number | null): string | null {
  if (distanceM === null) return null;
  return `${distanceM.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} m`;
}

export function formatScoreDelta(totalNet: number, leaderTotalNet: number): string {
  const delta = totalNet - leaderTotalNet;
  if (delta === 0) return "Ledare";
  return `+${delta}`;
}

export function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

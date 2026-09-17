import type { HTMLAttributes } from "react";

type Tone = "neutral" | "positive" | "highlight";

export function Chip({
  active = false,
  tone,
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { active?: boolean; tone?: Tone }) {
  const base = "font-label text-xs uppercase tracking-wide rounded-pill border px-3 py-1.5 inline-block";
  const resolvedTone: Tone = tone ?? (active ? "positive" : "neutral");
  const styles: Record<Tone, string> = {
    neutral: "bg-parchment text-ink border-gold",
    positive: "bg-fairway text-paper border-fairway",
    highlight: "bg-maroon text-parchment border-maroon-strong",
  };
  return <span className={`${base} ${styles[resolvedTone]} ${className}`} {...props} />;
}

import type { HTMLAttributes } from "react";

export function Chip({
  active = false,
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { active?: boolean }) {
  const base = "font-label text-xs uppercase tracking-wide rounded-pill border px-3 py-1.5 inline-block";
  const styles = active
    ? "bg-fairway text-paper border-fairway"
    : "bg-parchment text-ink border-gold";
  return <span className={`${base} ${styles} ${className}`} {...props} />;
}

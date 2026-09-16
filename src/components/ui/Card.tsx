import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mb-3 rounded-card border border-line bg-parchment p-4 shadow-card ${className}`}
      {...props}
    />
  );
}

export function CardLabel({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`font-label text-xs uppercase tracking-wide text-maroon ${className}`}
      {...props}
    />
  );
}

export function CardValue({
  className = "",
  compact = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { compact?: boolean }) {
  const size = compact ? "mt-1.5 text-base" : "mt-1 text-lg";
  return <div className={`font-heading font-semibold ${size} ${className}`} {...props} />;
}

export function CardSub({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-0.5 text-sm text-ink-soft ${className}`} {...props} />;
}

export function BadgeFrame({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded border border-gold text-center outline outline-1 outline-offset-[3px] outline-gold ${className}`}
      {...props}
    />
  );
}

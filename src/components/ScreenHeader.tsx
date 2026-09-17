export function ScreenHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4 text-center">
      <div className="font-label text-xs uppercase tracking-wide text-maroon">{eyebrow}</div>
      <h1 className="mt-1 font-display text-[26px] text-ink text-balance">{title}</h1>
      <div className="mt-2 text-gold-bright tracking-[0.4em] text-[9px]">★ ★ ★ ★ ★</div>
    </div>
  );
}

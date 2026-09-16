"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const items: Array<{ href: string; label: string; icon: ReactNode }> = [
  {
    href: "/dashboard",
    label: "Hem",
    icon: (
      <path d="M4 20V10l8-6 8 6v10M9 20v-6h6v6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    ),
  },
  {
    href: "/rounds",
    label: "Ronder",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 10h16M9 3v4M15 3v4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
  {
    href: "/longest-drive",
    label: "Drive",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 3v18M3 12h18" opacity="0.4" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
  {
    href: "/closest-to-pin",
    label: "Pin",
    icon: (
      <>
        <path
          d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
  {
    href: "/stats",
    label: "Statistik",
    icon: (
      <path
        d="M4 20V11M10 20V4M16 20v-7M22 20v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-parchment/95 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-2 py-1 ${active ? "text-maroon" : "text-ink-soft"}`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]">
              {item.icon}
            </svg>
            <span className="font-label text-[9px] uppercase tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

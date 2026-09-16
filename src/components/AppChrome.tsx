"use client";

import { usePathname } from "next/navigation";
import { PlayerGate } from "./PlayerGate";
import { BottomNav } from "./BottomNav";
import { RealtimeWatcher } from "./RealtimeWatcher";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = pathname !== "/";

  return (
    <PlayerGate>
      <RealtimeWatcher />
      <div className={showNav ? "pb-20" : ""}>{children}</div>
      {showNav && <BottomNav />}
    </PlayerGate>
  );
}

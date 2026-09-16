"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredPlayerName } from "@/lib/player";

/**
 * Sends anyone without a stored player name back to the name picker ("/").
 * The picker route itself is exempt so it can always render.
 *
 * This component lives in the root layout, so it never remounts between
 * client-side navigations — the localStorage check must therefore happen
 * fresh on every pathname change (inside the effect), not just once on
 * mount. A one-time read would go stale the moment a name is chosen and
 * cause a redirect loop: PlayerGate still "remembers" no name is set,
 * bounces back to "/", which re-reads localStorage fresh, sees the name,
 * and bounces forward again — back and forth forever.
 */
export function PlayerGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPickerRoute = pathname === "/";
  const [ready, setReady] = useState(isPickerRoute);

  useEffect(() => {
    if (isPickerRoute) {
      setReady(true);
      return;
    }
    if (getStoredPlayerName()) {
      setReady(true);
    } else {
      setReady(false);
      router.replace("/");
    }
  }, [pathname, isPickerRoute, router]);

  if (!isPickerRoute && !ready) {
    // Avoid flashing protected content before the redirect kicks in.
    return null;
  }

  return <>{children}</>;
}

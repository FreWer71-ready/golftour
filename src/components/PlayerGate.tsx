"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePlayerName } from "@/lib/use-player";

/**
 * Sends anyone without a stored player name back to the name picker ("/").
 * The picker route itself is exempt so it can always render.
 */
export function PlayerGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { name, loading } = usePlayerName();
  const isPickerRoute = pathname === "/";

  useEffect(() => {
    if (!loading && !name && !isPickerRoute) {
      router.replace("/");
    }
  }, [loading, name, isPickerRoute, router]);

  if (!isPickerRoute && (loading || !name)) {
    // Avoid flashing protected content before the redirect kicks in.
    return null;
  }

  return <>{children}</>;
}

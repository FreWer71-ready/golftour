"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

const WATCHED_TABLES = ["rounds", "round_scores", "longest_drive", "closest_to_pin"] as const;

/**
 * Subscribes to live changes on the tables the whole app cares about and
 * re-fetches the current Server Component tree when anything changes.
 * Mount this once, high in the tree (see layout.tsx) — every page benefits.
 */
export function RealtimeWatcher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserSupabase();
    const channel = supabase.channel("tour-updates");

    for (const table of WATCHED_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        router.refresh();
      });
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import { getStoredPlayerName } from "./player";

/** Reads the locally-stored player name once the component has mounted. */
export function usePlayerName(): { name: string | null; loading: boolean } {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setName(getStoredPlayerName());
    setLoading(false);
  }, []);

  return { name, loading };
}

"use client";

const STORAGE_KEY = "mallorca-golf-tour:player-name";

export function getStoredPlayerName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing / storage disabled — treat as "no player chosen".
    return null;
  }
}

export function setStoredPlayerName(name: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Ignore — worst case the player is asked to pick their name again.
  }
}

export function clearStoredPlayerName(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

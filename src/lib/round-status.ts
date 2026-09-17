import type { RoundStatus } from "./types/database";

export const ROUND_STATUS_LABEL: Record<RoundStatus, string> = {
  upcoming: "Kommande",
  ongoing: "Pågående",
  completed: "Spelad",
};

export const ROUND_STATUS_TONE: Record<RoundStatus, "neutral" | "positive" | "highlight"> = {
  upcoming: "neutral",
  ongoing: "highlight",
  completed: "positive",
};

export const ROUND_STATUS_DOT: Record<RoundStatus, string> = {
  upcoming: "bg-gold",
  ongoing: "bg-maroon",
  completed: "bg-fairway",
};

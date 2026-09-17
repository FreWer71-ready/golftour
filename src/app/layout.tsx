import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { AppChrome } from "@/components/AppChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mallorca Golf Tour",
  description: "Leaderboard, ronder och awards för Mallorca Golf Tour 2026.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fcf7ed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={fontVariables}>
      <body className="min-h-screen bg-paper font-body text-ink antialiased">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}

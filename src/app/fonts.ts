import { Abril_Fatface, Fraunces, IBM_Plex_Mono, Lora, Special_Elite } from "next/font/google";

export const fontDisplay = Abril_Fatface({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const fontHeading = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

export const fontBody = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const fontData = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-data",
  display: "swap",
});

export const fontLabel = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-label",
  display: "swap",
});

export const fontVariables = [fontDisplay, fontHeading, fontBody, fontData, fontLabel]
  .map((font) => font.variable)
  .join(" ");

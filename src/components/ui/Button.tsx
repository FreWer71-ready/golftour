import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "font-label text-sm uppercase tracking-wide rounded-lg px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
  const styles: Record<Variant, string> = {
    primary: "bg-maroon text-parchment border border-maroon-strong hover:bg-maroon-strong",
    secondary: "bg-transparent text-ink border border-gold hover:bg-gold/10",
  };

  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

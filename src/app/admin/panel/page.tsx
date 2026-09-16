import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/require-admin";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

const actions = [
  { href: "/admin/rounds", label: "Skapa / redigera rond" },
  { href: "/admin/rounds", label: "Registrera resultat" },
  { href: "/admin/longest-drive", label: "Registrera Longest Drive" },
  { href: "/admin/closest-to-pin", label: "Registrera Closest to Pin" },
  { href: "/admin/scoring", label: "Ändra poängsystem" },
];

export default function AdminPanelPage() {
  requireAdminPage();

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      <ScreenHeader eyebrow="Inloggad som admin" title="Adminpanel" />

      <div className="space-y-2.5">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-2.5 rounded-card border border-line bg-parchment px-3.5 py-3.5"
          >
            <span className="flex-1 font-heading text-[14.5px] font-semibold">{action.label}</span>
            <span className="text-gold">›</span>
          </Link>
        ))}
      </div>

      <div className="mt-5 text-center">
        <AdminLogoutButton />
      </div>
    </div>
  );
}

import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/Card";
import { formatDistance } from "@/lib/format";
import type { ClosestToPinWithPlayer, LongestDriveWithPlayer } from "@/lib/types/database";

export function LiveAwardsTable({
  longestDrive,
  closestToPin,
}: {
  longestDrive: LongestDriveWithPlayer | undefined;
  closestToPin: ClosestToPinWithPlayer | undefined;
}) {
  if (!longestDrive && !closestToPin) return null;

  return (
    <Card>
      <CardLabel>Extratävlingar · live</CardLabel>
      <div className="mt-2.5 divide-y divide-line">
        <AwardRow
          href="/longest-drive"
          label="Longest Drive"
          icon={
            <>
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 3v18M3 12h18" opacity="0.4" stroke="currentColor" strokeWidth="1.6" />
            </>
          }
          playerName={longestDrive?.player_name}
          detail={
            longestDrive
              ? `Hål ${longestDrive.hole}${
                  longestDrive.distance_m !== null ? ` · ${formatDistance(longestDrive.distance_m)}` : ""
                }`
              : undefined
          }
        />
        <AwardRow
          href="/closest-to-pin"
          label="Closest to Pin"
          icon={
            <>
              <path
                d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </>
          }
          playerName={closestToPin?.player_name}
          detail={
            closestToPin
              ? `Hål ${closestToPin.hole}${
                  closestToPin.distance_m !== null ? ` · ${formatDistance(closestToPin.distance_m)}` : ""
                }`
              : undefined
          }
        />
      </div>
    </Card>
  );
}

function AwardRow({
  href,
  label,
  icon,
  playerName,
  detail,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  playerName: string | undefined;
  detail: string | undefined;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 py-2.5">
      <svg viewBox="0 0 24 24" className="h-6 w-6 flex-none text-maroon">
        {icon}
      </svg>
      <span className="flex-1">
        <span className="block font-label text-[10px] uppercase tracking-wide text-ink-soft">{label}</span>
        <span className="block font-heading text-[14.5px] font-semibold">
          {playerName ?? "Ingen registrerad än"}
        </span>
        {detail && <span className="block text-[12px] text-ink-soft">{detail}</span>}
      </span>
      <span className="text-gold">›</span>
    </Link>
  );
}

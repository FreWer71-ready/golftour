import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/require-admin";
import { PinPad } from "@/components/PinPad";

export default function AdminGatePage() {
  if (isAdmin()) redirect("/admin/panel");
  return <PinPad />;
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutAdmin } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logoutAdmin();
          router.push("/admin");
          router.refresh();
        })
      }
    >
      Logga ut ur admin-läge
    </Button>
  );
}

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "./session";

export function isAdmin(): boolean {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSessionToken(token);
}

/** Call at the top of every protected admin Server Component page. */
export function requireAdminPage(): void {
  if (!isAdmin()) redirect("/admin");
}

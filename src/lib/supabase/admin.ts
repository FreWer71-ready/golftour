import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "./config";

/**
 * Service-role client. Bypasses Row Level Security entirely — it must only
 * ever be imported from Server Actions, and only after `ensureAdmin()` has
 * confirmed the caller has a valid admin session. Never import this from a
 * Client Component or anything that ships to the browser.
 */
export function getAdminSupabase() {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false },
  });
}

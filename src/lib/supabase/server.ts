import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Server-side read client for Server Components. Uses the public anon key
 * (same access as the browser) — it exists separately from the browser
 * client purely so each request gets a fresh instance.
 */
export function getServerSupabase() {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false },
  });
}

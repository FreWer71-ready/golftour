import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Server-side read client for Server Components. Uses the public anon key
 * (same access as the browser) — it exists separately from the browser
 * client purely so each request gets a fresh instance.
 *
 * `dynamic = "force-dynamic"` on each page keeps the *route* from being
 * statically cached, but Next.js still patches the global `fetch` used
 * internally by supabase-js and can cache individual requests unless told
 * otherwise — so every query here explicitly opts out with `cache: "no-store"`.
 * Without this, results can visibly lag behind the real database.
 */
export function getServerSupabase() {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

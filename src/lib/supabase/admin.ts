import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "./config";

/**
 * Service-role client. Bypasses Row Level Security entirely — it must only
 * ever be imported from Server Actions (src/app/actions.ts), never from a
 * Client Component or anything that ships to the browser. There's no admin
 * login: anyone with the app's link can write, by design, for this small
 * private group trip — this client exists to keep the service role key
 * itself off the client, not to gate who can call the actions.
 */
export function getAdminSupabase() {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false },
    // See server.ts for why: Next.js can cache the fetch calls supabase-js
    // makes internally even on a force-dynamic route.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

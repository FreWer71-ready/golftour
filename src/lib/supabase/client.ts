"use client";

import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./config";

let browserClient: ReturnType<typeof createClient> | null = null;

/**
 * Browser-side client, used for public reads and for the Realtime
 * subscription. Only ever holds the public anon key — RLS makes sure it
 * can read, never write.
 */
export function getBrowserSupabase() {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl(), supabaseAnonKey(), {
      auth: { persistSession: false },
    });
  }
  return browserClient;
}

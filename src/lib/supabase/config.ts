function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Saknar miljövariabeln ${name}. Kopiera .env.example till .env.local och fyll i dina Supabase-uppgifter.`
    );
  }
  return value;
}

// Next.js can only inline NEXT_PUBLIC_ variables into the browser bundle when
// they're referenced as a static `process.env.NEXT_PUBLIC_X` expression — a
// dynamic lookup like `process.env[name]` can't be statically analyzed at
// build time, so it silently stays empty on the client. Each variable must
// therefore be read directly here, not through a name-based helper.
export const supabaseUrl = () =>
  requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");

export const supabaseAnonKey = () =>
  requireEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const supabaseServiceRoleKey = () =>
  requireEnv(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");

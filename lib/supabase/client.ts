import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client. Only ever sees the publishable key, which is public by design.
 * The secret / service-role key is never used anywhere in this app.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

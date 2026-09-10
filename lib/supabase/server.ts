import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server client, reading the session from cookies so Server Components and
 * Server Actions run as the signed-in member. Requests carry that member's JWT,
 * which is what makes the RLS policies apply to them.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set({ name, value, ...options });
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/**
 * The signed-in member, or null. Uses getUser() rather than getSession() so the
 * token is verified with Supabase instead of trusted from the cookie.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Display name captured at sign-up, falling back to the email's local part. */
export function displayNameOf(user: {
  email?: string | null;
  user_metadata?: { display_name?: string | null };
}): string {
  const fromMeta = user.user_metadata?.display_name?.trim();
  if (fromMeta) return fromMeta;
  return user.email?.split("@")[0] ?? "there";
}

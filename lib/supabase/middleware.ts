import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Routes a stranger is allowed to see. Everything else requires a session. */
const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

/** Routes a signed-in member should not sit on. */
const AUTH_PATHS = new Set(["/", "/login", "/signup"]);

/**
 * Refreshes the session cookie and guards the app routes.
 *
 * Ticket 6 has two halves and this is the application one: a logged-out request
 * for an app route is redirected before any page renders, so there is no flash
 * of content and no empty shell hinting at data. The other half is the database
 * policy, which is what actually protects the rows — see scripts/verify-rls.mjs.
 */
export async function updateSession(
  request: NextRequest,
  /**
   * Headers to add to the request before it reaches the page. Used to pass the
   * per-request CSP nonce through, so Next can stamp it on its own scripts.
   */
  extraRequestHeaders: Record<string, string> = {},
) {
  const requestHeaders = new Headers(request.headers);
  for (const [key, value] of Object.entries(extraRequestHeaders)) {
    requestHeaders.set(key, value);
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: requestHeaders } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set({ name, value, ...options });
          }
        },
      },
    },
  );

  // getUser() verifies the token with Supabase. getSession() would only decode
  // whatever the cookie claims, which is not a check.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && !PUBLIC_PATHS.has(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PATHS.has(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

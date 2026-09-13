import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Finding 5: Content-Security-Policy.
 *
 * Built here rather than in next.config.ts because a meaningful policy needs a
 * fresh random nonce on every request. Allowing 'unsafe-inline' on script-src
 * instead would make the header decorative — it would permit exactly the
 * injected script it is supposed to stop.
 */
function buildCsp(nonce: string): string {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isDev = process.env.NODE_ENV !== "production";

  return [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonced bootstrap load the rest of the bundle.
    // The dev server compiles with eval, so that is allowed in dev only.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // React inline style attributes (style={{...}}) fall under style-src.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    // next/font self-hosts at build time, so no third-party font origin.
    "font-src 'self'",
    `connect-src 'self'${supabase ? ` ${supabase}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // The header version of X-Frame-Options: nobody may frame this site.
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);

  // Next reads these off the request to stamp the nonce onto its own scripts.
  const response = await updateSession(request, {
    "x-nonce": nonce,
    "content-security-policy": csp,
  });

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Every route except static assets and images. The auth guard must run on
     * page requests, so exclusions are kept to things that can never be a page.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

import type { NextConfig } from "next";

/**
 * Findings 5 and 10 from the security review.
 *
 * Next.js sets none of these by default. Content-Security-Policy is not here —
 * it needs a fresh nonce per request, so it is built in middleware.ts.
 */
const securityHeaders = [
  // Finding 5: stop any other site loading this one inside a frame, which is
  // how a clickjacking page tricks a signed-in member into clicking Delete.
  { key: "X-Frame-Options", value: "DENY" },

  // Stop the browser second-guessing a file's type and running it as script.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Do not hand the full URL of our pages to other sites in the referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // This app needs none of these, so deny them outright.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },

  // Detach from any window that opened us, so it cannot reach into this one.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Finding 10: stop advertising the framework to every visitor.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

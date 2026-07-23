import type { NextConfig } from "next";

/**
 * Content-Security-Policy scoped to what the site actually loads:
 *  - script/style 'unsafe-inline': Next's App Router injects inline bootstrap
 *    scripts and framer-motion sets inline styles (no nonce middleware here).
 *  - img https:: business avatars (backend), remote demo images, map tiles.
 *  - frame-src google: the embedded Google Maps location iframe.
 *  - connect-src backend: defensive (calls are server-side, but harmless to allow).
 * frame-ancestors 'none' + object-src 'none' + base-uri 'self' are the real
 * hardening wins (clickjacking / base-tag / plugin injection).
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://apis.automations.uz",
  "frame-src https://maps.google.com https://www.google.com",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Drop the "X-Powered-By: Next.js" tech-disclosure header.
  poweredByHeader: false,
  // Cloudflare Workers have no sharp; local marketing images are already
  // sized, tenant pages use plain <img> for backend media anyway.
  images: { unoptimized: true },
  allowedDevOrigins: [
    "lcd-and-down-infrared.trycloudflare.com",
    "*.trycloudflare.com",
  ],
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async redirects() {
    return [
      // The barbershop category page moved to an English slug.
      { source: "/business/sartaroshxonalar", destination: "/business/barbershops", permanent: true },
    ];
  },
};

export default nextConfig;

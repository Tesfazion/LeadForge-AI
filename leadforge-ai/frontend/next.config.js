/**
 * Next.js configuration
 *
 * This file is loaded as CommonJS by Next.js 14 (the frontend package.json
 * does NOT have "type": "module"), so `module.exports` is correct here.
 * Using `export default` in a CJS context can silently fail in some setups.
 *
 * Local development:
 *   The `rewrites` block proxies every /api/* request to the Express backend
 *   running on NEXT_PUBLIC_API_URL (e.g. http://localhost:4000).  This avoids
 *   CORS issues in dev and mirrors the Vercel routing in production.
 *
 * Production (Vercel):
 *   NEXT_PUBLIC_API_URL is intentionally left unset on Vercel, so `apiBase`
 *   is undefined and `rewrites()` returns [].  vercel.json's rewrite rule
 *   routes /api/:path* to the serverless function instead.
 *
 * @type {import('next').NextConfig}
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;

    // Return empty array on Vercel (vercel.json handles routing)
    if (!apiBase) return [];

    return [
      {
        // Proxy /api/* → Express backend in local dev
        source:      "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Razorpay checkout + its own webview, a keyless Google Maps embed on
// tournament pages and YouTube (privacy-enhanced) video embeds are the only
// third-party origins this app talks to.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.amazonaws.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.amazonaws.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://api.razorpay.com",
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.google.com https://maps.google.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      // Event photographer's gallery (temporary, watermarked proofs — see
      // src/lib/featured-photos.ts) and licensed Unsplash stock photos.
      { protocol: "https", hostname: "aipixture.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // YouTube video thumbnails (gallery highlights).
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async redirects() {
    // www served a duplicate copy of the site (200, no redirect) — send it to the apex.
    // Trailing slashes are already handled by Next's default /path/ → /path redirect.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.nagaratharschesschampionship.org" }],
        destination: "https://nagaratharschesschampionship.org/:path*",
        statusCode: 301,
      },
      // The old raster logo moved with the brand kit; tournaments may still use it as their poster.
      { source: "/images/logo.png", destination: "/brand/legacy/logo.png", statusCode: 301 },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // ID-card PDFs are previewed in an iframe on the admin Players page (later rules win).
        source: "/api/admin/id-cards/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp.replace("frame-ancestors 'none'", "frame-ancestors 'self'"),
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;

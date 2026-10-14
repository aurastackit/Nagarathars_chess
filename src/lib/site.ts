/** Canonical site origin, used for absolute URLs (OG images, .ics files, share links).
 * Falls back to localhost for local dev only — production always sets NEXT_PUBLIC_SITE_URL
 * (see amplify.yml's env-runtime step), so no Amplify-internal URL should ever appear here. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

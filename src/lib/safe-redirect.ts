/**
 * Where to send the admin after signing in: the `callbackUrl` the proxy added,
 * but only if it's a same-origin path inside the admin area. Anything else
 * (another origin, `//evil.com`, `/\evil.com`, the login page itself) falls
 * back to the dashboard.
 */
export function adminCallbackPath(value: unknown, fallback = "/admin") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  const base = "http://same-origin.invalid";
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return fallback;
  }
  if (url.origin !== base) return fallback;
  if (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/")) return fallback;
  if (url.pathname === "/admin/login") return fallback;
  return `${url.pathname}${url.search}`;
}

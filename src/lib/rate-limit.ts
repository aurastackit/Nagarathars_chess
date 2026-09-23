/**
 * Best-effort in-memory rate limiter, keyed per warm serverless instance.
 * It resets on cold start and isn't shared across concurrent instances, so
 * it won't stop a determined distributed attacker — but it does blunt the
 * common case (a script hammering one form from one IP), which is the
 * actual threat model for a small community site. A real multi-instance
 * limiter would need a shared store (e.g. Upstash Redis), which isn't wired
 * up here.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// Prevent unbounded growth if the process stays warm a long time.
const MAX_TRACKED_KEYS = 5000;

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

/** Best-effort client IP from the headers a proxy (CloudFront/Amplify) sets. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

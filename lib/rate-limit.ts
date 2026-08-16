import { NextRequest } from "next/server";

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * There is currently no real authentication in this project (see
 * app/api/generate/route.ts -> getSession), which means every visitor
 * shares the same server-side Groq API keys. Without *some* throttle,
 * a single visitor (or a bot) can send unlimited requests and burn
 * through the API quota/cost for everyone.
 *
 * This is a pragmatic stop-gap, not a replacement for real auth + a
 * persistent store (Redis/Upstash) in production — an in-memory map
 * resets on every server restart/deploy and is per-instance only.
 * It's enough to stop casual/automated abuse on a single-instance
 * deployment (e.g. this Codespace / a small VPS).
 */

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

// Clean up old buckets occasionally so the Map doesn't grow forever.
let lastSweep = Date.now();
function sweep(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > windowMs) buckets.delete(key);
  }
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Returns { allowed, remaining, retryAfterSeconds }.
 * Defaults to 10 requests per 60 seconds per IP — generous enough for
 * normal iterative use, tight enough to stop a runaway script/bot.
 */
export function checkRateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  sweep(windowMs);

  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

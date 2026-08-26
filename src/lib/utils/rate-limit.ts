/**
 * Simple in-memory rate limiter.
 * State resets on cold starts (acceptable for Edge/Node deployments).
 *
 * Usage:
 *   const result = checkRateLimit(ip);
 *   if (!result.allowed) return Response.json({ error: result.message }, { status: 429 });
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Module-scope map — shared across requests in the same process
const ipMap = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  message?: string;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // First attempt or window expired — reset
    const resetAt = now + WINDOW_MS;
    ipMap.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetAt };
  }

  entry.count += 1;

  if (entry.count > MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      message: `Too many login attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
    };
  }

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Reset the counter for a given IP (e.g. on successful login) */
export function resetRateLimit(ip: string): void {
  ipMap.delete(ip);
}

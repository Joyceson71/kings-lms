import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  message?: string;
}

export async function checkRateLimit(
  key: string,
  options: { limit?: number; windowMs?: number } = {},
): Promise<RateLimitResult> {
  const limit = options.limit ?? 5;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const rateKey = createHash('sha256').update(key).digest('hex');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('consume_api_rate_limit', {
    p_rate_key: rateKey,
    p_max_requests: limit,
    p_window_seconds: Math.ceil(windowMs / 1000),
  });

  if (error) {
    console.error('[rate-limit] Supabase check failed', { error: error.message });
    throw new Error('Rate limit service unavailable');
  }

  const result = data?.[0];
  if (!result) throw new Error('Rate limit service returned no result');
  const resetAt = new Date(result.reset_at).getTime();
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetAt,
    ...(!result.allowed ? { message: `Too many requests. Please retry in ${Math.ceil(retryAfter / 60)} minute(s).` } : {}),
  };
}

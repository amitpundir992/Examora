/**
 * In-memory sliding-window rate limiter. For production/multi-instance,
 * replace with Upstash Redis (@upstash/ratelimit) — same `limit()` signature.
 */
const globalForRl = globalThis as unknown as { __rl?: Map<string, number[]> };
function buckets(): Map<string, number[]> {
  if (!globalForRl.__rl) globalForRl.__rl = new Map();
  return globalForRl.__rl;
}

export function limit(key: string, max = 20, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const hits = (buckets().get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return { ok: false, remaining: 0 };
  hits.push(now);
  buckets().set(key, hits);
  return { ok: true, remaining: max - hits.length };
}

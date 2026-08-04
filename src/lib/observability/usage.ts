import { getRedisClient } from "@/lib/security/rate-limit-redis";

/**
 * External API usage counters.
 *
 * ── Storage: Redis, never Postgres ──────────────────────────────────────────
 * Metrics are written on the hot path of real user requests. Putting them in
 * the application database would add a write to every search, every email and
 * every geocode — turning an observability feature into a source of load on the
 * database that serves the actual car listings. They live in the Redis instance
 * that already backs rate limiting, with a bounded in-memory fallback when
 * `REDIS_URL` is unset (mirroring how `rate-limit-redis.ts` degrades).
 *
 * No schema, no migration, no table. Counters are disposable: losing them costs
 * a chart, not data.
 *
 * ── Instrumentation must never break a request ──────────────────────────────
 * `recordApiCall` is fire-and-forget and swallows every error. A metrics
 * backend being down must never turn a working enquiry form into a 500.
 */

/** Counters older than this are dropped. Two months keeps month-to-date honest. */
const RETENTION_SECONDS = 62 * 24 * 60 * 60;

/** Cap on in-memory day buckets when Redis is unavailable. */
const MAX_MEMORY_DAYS = 62;

export type ApiCallOutcome = {
  /** false for a transport error or a non-2xx response. */
  ok: boolean;
  /** Round-trip duration in milliseconds, when the caller measured it. */
  durationMs?: number;
};

export type ProviderUsage = {
  code: string;
  requests: number;
  errors: number;
  /** Mean round-trip time in ms across calls that reported a duration. */
  avgMs: number | null;
};

export type UsageWindow = {
  /** Provider totals for the window. */
  providers: ProviderUsage[];
  /** Daily request totals, oldest first, for the sparkline. */
  daily: { date: string; requests: number; errors: number }[];
  /** True when counters came from Redis; false means per-instance memory only. */
  durable: boolean;
};

// ── Day bucketing in the dealer's timezone ──────────────────────────────────
// Staff read "today" as a Sydney day. Bucketing in UTC would roll the counter
// over mid-afternoon during AEDT (failure-modes.md F24: always an IANA zone,
// never a fixed offset).
const DEALER_TZ = "Australia/Sydney";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DEALER_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `YYYY-MM-DD` for the given instant, in the dealer's timezone. */
export function dayKey(at: Date): string {
  return dayFormatter.format(at);
}

/** The last `days` day-keys, oldest first, ending on the day containing `at`. */
export function recentDayKeys(days: number, at: Date): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(at.getTime() - i * 24 * 60 * 60 * 1000)));
  }
  return keys;
}

const redisKey = (day: string) => `apiusage:${day}`;

// ── In-memory fallback ──────────────────────────────────────────────────────
type DayCounters = Map<string, number>;
const memory = new Map<string, DayCounters>();

function memoryBucket(day: string): DayCounters {
  let bucket = memory.get(day);
  if (!bucket) {
    bucket = new Map();
    memory.set(day, bucket);
    // Bound growth: a long-lived process must not accumulate buckets forever.
    if (memory.size > MAX_MEMORY_DAYS) {
      const oldest = [...memory.keys()].sort()[0];
      memory.delete(oldest);
    }
  }
  return bucket;
}

/**
 * Records one outbound API call. Fire-and-forget: callers must NOT await this
 * on a user-facing path, and it never rejects.
 */
export function recordApiCall(providerCode: string, outcome: ApiCallOutcome, at: Date = new Date()): void {
  const day = dayKey(at);
  const fields: [string, number][] = [
    [`${providerCode}:requests`, 1],
    [`${providerCode}:errors`, outcome.ok ? 0 : 1],
  ];
  if (outcome.durationMs != null && Number.isFinite(outcome.durationMs)) {
    fields.push([`${providerCode}:ms`, Math.round(outcome.durationMs)]);
    fields.push([`${providerCode}:timed`, 1]);
  }

  const redis = getRedisClient();
  if (!redis) {
    const bucket = memoryBucket(day);
    for (const [field, delta] of fields) {
      if (delta !== 0) bucket.set(field, (bucket.get(field) ?? 0) + delta);
    }
    return;
  }

  // Pipeline so one call costs a single round trip, and never surface failures:
  // a metrics write must not affect the request that triggered it.
  const pipeline = redis.pipeline();
  for (const [field, delta] of fields) {
    if (delta !== 0) pipeline.hincrby(redisKey(day), field, delta);
  }
  pipeline.expire(redisKey(day), RETENTION_SECONDS);
  pipeline.exec().catch(() => { /* metrics are best-effort by design */ });
}

/**
 * Wraps an outbound call so its outcome and duration are recorded whether it
 * resolves or throws, then re-throws unchanged.
 *
 * The original error propagates untouched — instrumentation observes, it never
 * changes behaviour.
 */
export async function trackApiCall<T>(providerCode: string, fn: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await fn();
    recordApiCall(providerCode, { ok: true, durationMs: Date.now() - startedAt });
    return result;
  } catch (error) {
    recordApiCall(providerCode, { ok: false, durationMs: Date.now() - startedAt });
    throw error;
  }
}

function parseBucket(raw: Record<string, string> | null | undefined): Map<string, number> {
  const out = new Map<string, number>();
  for (const [field, value] of Object.entries(raw ?? {})) {
    const n = Number(value);
    if (Number.isFinite(n)) out.set(field, n);
  }
  return out;
}

/**
 * Reads usage over the last `days` days (inclusive of today).
 *
 * Returns zeroes rather than throwing when the metrics backend is unreachable:
 * an admin dashboard that 500s because Redis blipped is worse than one showing
 * an empty chart with `durable: false`.
 */
export async function getUsage(
  providerCodes: readonly string[],
  days: number,
  at: Date = new Date(),
): Promise<UsageWindow> {
  const dayKeys = recentDayKeys(days, at);
  const buckets: Map<string, number>[] = [];
  let durable = false;

  const redis = getRedisClient();
  if (redis) {
    try {
      const pipeline = redis.pipeline();
      for (const day of dayKeys) pipeline.hgetall(redisKey(day));
      const results = await pipeline.exec();
      for (const entry of results ?? []) {
        const [err, value] = entry as [Error | null, Record<string, string>];
        buckets.push(err ? new Map() : parseBucket(value));
      }
      durable = true;
    } catch {
      buckets.length = 0;
    }
  }

  if (buckets.length === 0) {
    for (const day of dayKeys) buckets.push(new Map(memory.get(day) ?? []));
  }

  const providers: ProviderUsage[] = providerCodes.map((code) => {
    let requests = 0;
    let errors = 0;
    let totalMs = 0;
    let timed = 0;
    for (const bucket of buckets) {
      requests += bucket.get(`${code}:requests`) ?? 0;
      errors += bucket.get(`${code}:errors`) ?? 0;
      totalMs += bucket.get(`${code}:ms`) ?? 0;
      timed += bucket.get(`${code}:timed`) ?? 0;
    }
    return { code, requests, errors, avgMs: timed > 0 ? Math.round(totalMs / timed) : null };
  });

  const daily = dayKeys.map((date, i) => {
    const bucket = buckets[i] ?? new Map();
    let requests = 0;
    let errors = 0;
    for (const code of providerCodes) {
      requests += bucket.get(`${code}:requests`) ?? 0;
      errors += bucket.get(`${code}:errors`) ?? 0;
    }
    return { date, requests, errors };
  });

  return { providers, daily, durable };
}

/** Test-only: clears the in-memory fallback between cases. */
export function __resetUsageMemory(): void {
  memory.clear();
}

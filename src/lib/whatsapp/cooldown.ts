import { getRedisClient } from "@/lib/security/rate-limit-redis";

/**
 * Acknowledgement cooldown for the WhatsApp auto-responder.
 *
 * Determines whether an acknowledgement should be sent to a given phone number,
 * enforcing at most one acknowledgement per phone per cooldown window.
 *
 * Backed by Redis using `SET key NX PX cooldownMs` (atomic, distributed) with an
 * in-memory `Map` fallback mirroring `src/lib/security/rate-limit-redis.ts` for
 * local/dev environments where Redis is not configured.
 */

const REDIS_KEY_PREFIX = "whatsapp:ack:";

/**
 * Returns true when an acknowledgement should be sent for `phone`, i.e. when no
 * acknowledgement has been sent within the last `cooldownMs` milliseconds.
 *
 * - A `cooldownMs` of `0` (or negative) means always acknowledge.
 * - With Redis available, uses `SET NX PX` so the key is only set when absent;
 *   a newly set key (reply "OK") means acknowledge.
 * - Without Redis, falls back to an in-memory timestamp map.
 */
export async function shouldAcknowledge(
  phone: string,
  cooldownMs: number,
): Promise<boolean> {
  // A zero/negative cooldown means there is no suppression window at all.
  if (cooldownMs <= 0) {
    return true;
  }

  const redis = getRedisClient();

  if (!redis) {
    return fallbackShouldAcknowledge(phone, cooldownMs);
  }

  const result = await redis.set(
    `${REDIS_KEY_PREFIX}${phone}`,
    Date.now().toString(),
    "PX",
    cooldownMs,
    "NX",
  );

  // ioredis returns "OK" when the key was newly set, null when NX prevented it.
  return result === "OK";
}

// In-memory fallback: phone -> timestamp (ms) of the last acknowledgement.
const lastAckByPhone = new Map<string, number>();

function fallbackShouldAcknowledge(phone: string, cooldownMs: number): boolean {
  const now = Date.now();
  const lastAck = lastAckByPhone.get(phone);

  const allowed = lastAck === undefined || now - lastAck >= cooldownMs;

  if (allowed) {
    lastAckByPhone.set(phone, now);
  }

  // Cleanup stale entries periodically, mirroring the rate-limit fallbacks.
  if (Math.random() < 0.01) {
    cleanupStaleAcks(now, cooldownMs);
  }

  return allowed;
}

function cleanupStaleAcks(now: number, cooldownMs: number) {
  // Keep a generous buffer so concurrent windows are not pruned prematurely.
  const cutoff = now - Math.max(cooldownMs, 24 * 60 * 60 * 1000);
  for (const [phone, timestamp] of lastAckByPhone.entries()) {
    if (timestamp < cutoff) {
      lastAckByPhone.delete(phone);
    }
  }
}

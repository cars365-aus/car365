import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Feed URL tokens for `pull_feed` channels.
 *
 * ── Why a token and not real auth ───────────────────────────────────────────
 * Channels like Gumtree and carsales fetch a feed URL unauthenticated, from
 * rotating IP ranges, on their own schedule. There is no place to put a bearer
 * token and no stable IP range to allowlist. The URL itself is the credential
 * (architecture.md §6).
 *
 * That is acceptable because a feed's contents mirror the public website — it
 * carries no data a visitor could not already scrape from the listings. The
 * token exists to stop casual enumeration and to give us a revocation handle,
 * not to protect secrets.
 *
 * ── Rotation has a grace window ─────────────────────────────────────────────
 * Rotating invalidates the URL the channel is already polling, and nobody
 * notices until listings quietly vanish. So the previous token stays valid for
 * seven days while staff paste the new URL at the channel (failure-modes.md
 * F18). Verification reports WHICH token matched, so the sync engine can warn
 * when a channel is still fetching the old URL after rotation.
 *
 * ── Never logged ────────────────────────────────────────────────────────────
 * Tokens are credentials (Hard Rule 5). Nothing in this module writes to a log,
 * and `describeToken` exists so admin UI and audit records can reference a
 * token without reproducing it.
 */

/** Grace period during which a rotated-out token still works. */
export const ROTATION_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

/** Bytes of entropy in the random salt. Architecture requires ≥ 32. */
const SALT_BYTES = 32;

export class MissingFeedSecretError extends Error {
  constructor() {
    super(
      "FEED_SIGNING_SECRET is not set. Feed URLs cannot be issued or verified without it.",
    );
    this.name = "MissingFeedSecretError";
  }
}

function signingSecret(): string {
  const secret = process.env.FEED_SIGNING_SECRET?.trim();
  // Fail loudly rather than deriving tokens from an empty string, which would
  // make every dealer's feed URL trivially predictable.
  if (!secret || secret.length < 32) throw new MissingFeedSecretError();
  return secret;
}

/**
 * Derives a feed token for one dealer/channel pair.
 *
 * The random `salt` is what makes rotation possible: without it the token is a
 * pure function of (secret, dealer, channel) and could never change without
 * rotating the global secret for everyone.
 */
export function deriveFeedToken(input: {
  dealerId: string;
  channelCode: string;
  salt?: string;
}): { token: string; salt: string } {
  const salt = input.salt ?? randomBytes(SALT_BYTES).toString("hex");
  const token = createHmac("sha256", signingSecret())
    .update(`${input.dealerId}|${input.channelCode}|${salt}`)
    .digest("hex");
  return { token, salt };
}

export type FeedTokenMatch = "current" | "previous" | "none";

/**
 * Constant-time comparison of a presented token against the current and
 * previous tokens.
 *
 * Returns which one matched rather than a boolean, because "valid, but they're
 * still using the old URL" is operationally different from "valid" — it means
 * the rotation was never completed at the channel.
 */
export function verifyFeedToken(input: {
  presented: string;
  current: string | null;
  previous: string | null;
  rotatedAt: Date | null;
  now: Date;
}): FeedTokenMatch {
  const { presented, current, previous, rotatedAt, now } = input;
  if (!presented) return "none";

  if (current && constantTimeEquals(presented, current)) return "current";

  if (previous && rotatedAt) {
    const withinGrace = now.getTime() - rotatedAt.getTime() <= ROTATION_GRACE_MS;
    if (withinGrace && constantTimeEquals(presented, previous)) return "previous";
  }

  return "none";
}

/** Length-safe constant-time compare — never leaks a match position. */
function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual throws on differing lengths, which would itself leak length.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Public feed URL for a channel, given its token. */
export function buildFeedUrl(baseUrl: string, channelCode: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/syndication/feed/${channelCode}?token=${token}`;
}

/**
 * A non-reversible reference to a token, safe for logs, audit records and
 * screenshots: first and last four characters only.
 */
export function describeToken(token: string | null | undefined): string {
  if (!token) return "none";
  if (token.length <= 12) return "set";
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

/** Milliseconds of grace remaining, or 0 once the window has closed. */
export function graceRemainingMs(rotatedAt: Date | null, now: Date): number {
  if (!rotatedAt) return 0;
  return Math.max(0, ROTATION_GRACE_MS - (now.getTime() - rotatedAt.getTime()));
}

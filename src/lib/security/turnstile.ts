import { optionalEnv } from "@/lib/config";
import { recordApiCall } from "@/lib/observability/usage";

export async function verifyTurnstile(token?: string, ip?: string) {
  const secret = optionalEnv("TURNSTILE_SECRET_KEY");

  if (!secret) {
    if (process.env.NODE_ENV === "production" && process.env.TURNSTILE_SKIP !== "true") {
      return { ok: false, skipped: false };
    }
    return { ok: true, skipped: true };
  }

  if (!token) {
    return { ok: false, skipped: false };
  }

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);

  if (ip) {
    body.append("remoteip", ip);
  }

  const startedAt = Date.now();
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body,
    },
  );
  const payload = (await response.json()) as { success?: boolean };
  const ok = payload.success === true;

  // Observe-only, for the admin API-usage dashboard. A failed verification is
  // counted as an error because that is the signal staff care about here: a
  // spike means a bot campaign against the enquiry forms, not a Cloudflare
  // outage. Never awaited, never throws.
  recordApiCall("turnstile", { ok, durationMs: Date.now() - startedAt });

  return { ok, skipped: false };
}

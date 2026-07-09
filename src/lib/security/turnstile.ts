import { optionalEnv } from "@/lib/config";

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

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body,
    },
  );
  const payload = (await response.json()) as { success?: boolean };

  return { ok: payload.success === true, skipped: false };
}

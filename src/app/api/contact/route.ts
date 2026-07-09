import { NextResponse, type NextRequest } from "next/server";
import { sendContactMessage } from "@/lib/email/ses";
import { clientIp } from "@/lib/security/rate-limit";
import { rateLimitSlidingWindow } from "@/lib/security/rate-limit-redis";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { contactMessageSchema } from "@/lib/validation/schemas";

const topicLabels: Record<string, string> = {
  vendor_onboarding: "Vendor onboarding",
  enterprise: "Enterprise plan",
  support: "Support",
  legal_privacy: "Legal or privacy",
};

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const limit = await rateLimitSlidingWindow(`contact-message:${ip}`, 5, 60 * 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Too many contact messages. Please try again later.",
        retryAfter: limit.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter || 3600) } },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = contactMessageSchema.safeParse(rawBody);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const challenge = await verifyTurnstile(payload.data.turnstileToken, ip);
  if (!challenge.ok) {
    return NextResponse.json({ error: "Security challenge failed" }, { status: 403 });
  }

  const result = await sendContactMessage({
    name: payload.data.name,
    email: payload.data.email,
    topic: topicLabels[payload.data.topic],
    message: payload.data.message,
  });

  if (result.skipped && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Contact email is not configured" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, skippedEmail: result.skipped }, { status: 202 });
}

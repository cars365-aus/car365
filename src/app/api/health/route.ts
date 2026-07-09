import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { optionalEnv } from "@/lib/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Returns true when the request carries a valid worker bearer token. Used to
 * unlock the deeper (write) diagnostic. The public probe never writes and never
 * leaks configuration details.
 */
function isAuthorizedDeepCheck(request: NextRequest): boolean {
  const secret = optionalEnv("WORKER_API_KEY")?.trim();
  if (!secret) return false;
  const authHeader = request.headers.get("authorization")?.trim();
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Public liveness/readiness: a single read-only query verifies Vercel edge
    // execution + Supabase connectivity. No writes, no secrets.
    const { error: readError } = await supabase.from("vehicles").select("id").limit(1);

    // Deep diagnostic (authenticated only): exercise a write path against the
    // webhook events table. Kept off the public path to avoid write
    // amplification / abuse and to prevent leaking error details.
    let deep: Record<string, unknown> | undefined;
    if (isAuthorizedDeepCheck(request)) {
      const webhookProbeId = `health_${Date.now()}`;
      const { error: webhookWriteError } = await supabase
        .from("stripe_webhook_events")
        .insert({
          id: webhookProbeId,
          event_type: "health_check",
          payload: { ok: true },
          processing_status: "processing",
        });

      if (!webhookWriteError) {
        await supabase.from("stripe_webhook_events").delete().eq("id", webhookProbeId);
      }

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
      deep = {
        webhookTableWriteOk: !webhookWriteError,
        serviceRoleKeyConfigured: serviceRoleKey.length > 0,
        webhookWriteError: webhookWriteError?.message ?? null,
        webhookWriteCode: webhookWriteError?.code ?? null,
      };
    }

    const healthy = !readError;

    return NextResponse.json(
      {
        status: healthy ? "ok" : "unhealthy",
        timestamp: new Date().toISOString(),
        ...(deep ? { diagnostics: deep } : {}),
      },
      { status: healthy ? 200 : 503 },
    );
  } catch (err) {
    // Never leak internal error details on the public endpoint.
    console.error("[Health Check] Unknown error:", err);
    return NextResponse.json(
      { status: "unhealthy", timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}

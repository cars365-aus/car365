import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Liveness/readiness: a single read-only query verifies serverless execution
    // + Supabase connectivity. No writes, no secrets.
    const { error: readError } = await supabase.from("vehicles").select("id").limit(1);

    const healthy = !readError;

    return NextResponse.json(
      {
        status: healthy ? "ok" : "unhealthy",
        timestamp: new Date().toISOString(),
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

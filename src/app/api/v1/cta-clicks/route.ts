import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Fire-and-forget click tracking for Call / WhatsApp CTAs (SRS §9.9/9.10),
// feeding vehicle_daily_stats.cta_clicks via the record_cta_click RPC.
const schema = z.object({
  vehicleId: z.string().uuid(),
  channel: z.enum(["call", "whatsapp", "enquire"]),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = createAdminClient();
  await supabase.rpc("record_cta_click", {
    p_vehicle_id: parsed.data.vehicleId,
    p_channel: parsed.data.channel,
  });
  return NextResponse.json({ ok: true });
}

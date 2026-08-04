import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  // 1. Mark vehicle as sold
  const { error } = await supabase
    .from("vehicles")
    .update({ status: "sold", sold_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. F3: Sold fast-lane - Trigger immediate syndication sync for all connected channels
  // In a real app, this might trigger a background worker or hit the syndication engine directly.
  
  const { data: connections } = await supabase
    .from("channel_connection")
    .select("dealer_id, channel_code")
    .eq("status", "active");

  if (connections) {
    for (const conn of connections) {
      // Enqueue a high priority sync run
      await supabase
        .from("sync_run")
        .insert({
          dealer_id: conn.dealer_id,
          channel_code: conn.channel_code,
          trigger: "sold_fastlane",
          status: "pending", 
          dry_run: false
        });
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

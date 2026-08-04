import { createAdminClient } from "@/lib/supabase/admin";

/**
 * MOCK: Google Merchant Center Reconciliation
 * Requires `@googleapis/content` and `GOOGLE_CLIENT_EMAIL` / `GOOGLE_PRIVATE_KEY` 
 * to be fully implemented. This stub prevents the job from failing until we are
 * authorized as a partner or have proper credentials.
 */

export async function runGoogleReconciliation(dealerId: string, channelCode: string) {
  const supabase = createAdminClient();
  
  const { data: connection } = await supabase
    .from("channel_connection")
    .select("*")
    .eq("dealer_id", dealerId)
    .eq("channel_code", channelCode)
    .single();

  if (!connection) {
    throw new Error("No connection found for reconciliation");
  }
  
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.warn(`[GMC Reconciliation] Credentials missing. Skipping for ${channelCode}.`);
    return { success: true, processed: 0, status: "skipped" };
  }

  const merchantId = connection.external_account_id;
  if (!merchantId) {
    throw new Error("Missing Merchant ID (external_account_id)");
  }

  // TODO: Fetch item statuses from GMC
  // const auth = new google.auth.GoogleAuth({ ... });
  // const contentApi = content({ version: 'v2.1', auth });
  // const response = await contentApi.productstatuses.list({ merchantId });
  
  const mockedRejections: Array<{ offerId: string; issues: Array<{ description: string; code: string }> }> = [
    // This would normally be parsed from response.data.resources
  ];

  let processed = 0;

  for (const item of mockedRejections) {
    // Look up the listing by stock number (since offerId is usually the stock number for vehicles)
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id")
      .eq("stock_id", item.offerId);

    if (vehicles && vehicles.length > 0) {
      const vehicleId = vehicles[0].id;

      await supabase.from("channel_listing").upsert({
        vehicle_id: vehicleId,
        channel_code: channelCode,
        state: "rejected",
        rejection_code: item.issues[0]?.code || "GMC_REJECTED",
        rejection_message: item.issues[0]?.description || "Rejected by Google Merchant Center",
        rejection_at: new Date().toISOString()
      }, { onConflict: "vehicle_id,channel_code" });
      
      await supabase.from("syndication_event").insert({
        vehicle_id: vehicleId,
        channel_code: channelCode,
        event_type: "reconciliation_rejection",
        detail: { issues: item.issues }
      });
      
      processed++;
    }
  }
  
  return { success: true, processed, status: "completed" };
}

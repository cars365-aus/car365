import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { bidSchema } from "@/lib/validation/schemas";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignore if called from a Server Component
          }
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = bidSchema.safeParse(rawBody);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Validate vehicle exists and is available
  const { data: vehicle, error: vehicleError } = await adminClient
    .from("vehicles")
    .select("id, status, organization_id")
    .eq("id", payload.data.vehicleId)
    .in("status", ["available", "reserved"])
    .single();

  if (vehicleError || !vehicle) {
    return NextResponse.json(
      { error: "Invalid vehicle or vehicle not available" },
      { status: 400 },
    );
  }

  // Insert the bid
  const { data: bid, error: bidError } = await supabase
    .from("bids")
    .insert({
      vehicle_id: payload.data.vehicleId,
      buyer_id: user.id,
      amount: payload.data.amount,
      message: payload.data.message || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (bidError) {
    console.error(`[Bid API] Failed to save bid:`, bidError);
    return NextResponse.json({ error: "Unable to save bid" }, { status: 500 });
  }

  // Automatically create a lead for this bid
  const { data: lead, error: leadError } = await adminClient
    .from("leads")
    .insert({
      type: "vehicle_enquiry",
      vehicle_id: payload.data.vehicleId,
      name: user.user_metadata?.full_name || "Buyer",
      email: user.email,
      phone: user.user_metadata?.phone || "0000000000",
      message: `Offer submitted for $${payload.data.amount}. ${payload.data.message || ''}`,
      status: "new",
      payload: {
        vendor_id: vehicle.organization_id,
        bid_id: bid.id,
      },
    })
    .select("id")
    .single();

  if (!leadError && lead) {
    // Create a chat thread linked to the lead
    const { data: thread } = await adminClient.from("chat_threads").insert({
      vehicle_id: payload.data.vehicleId,
      buyer_id: user.id,
      lead_id: lead.id,
    }).select("id").single();
    
    if (thread && payload.data.message) {
      // Insert initial message
      await adminClient.from("chat_messages").insert({
        thread_id: thread.id,
        sender_id: user.id,
        content: `I would like to make an offer of $${payload.data.amount}. ${payload.data.message}`,
      });
    }
  }

  return NextResponse.json({ bidId: bid.id }, { status: 201 });
}

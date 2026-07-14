import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { chatMessageCreateSchema } from "@/lib/validation/schemas";
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

  const payload = chatMessageCreateSchema.safeParse(rawBody);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Validate vehicle exists
  const { data: vehicle, error: vehicleError } = await adminClient
    .from("vehicles")
    .select("id, organization_id")
    .eq("id", payload.data.vehicleId)
    .single();

  if (vehicleError || !vehicle) {
    return NextResponse.json(
      { error: "Invalid vehicle" },
      { status: 400 },
    );
  }

  // Find or create chat thread
  let { data: thread } = await supabase
    .from("chat_threads")
    .select("id, lead_id")
    .eq("vehicle_id", payload.data.vehicleId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (!thread) {
    // Automatically create a lead for this chat thread if none exists
    const { data: lead } = await adminClient
      .from("leads")
      .insert({
        type: "general",
        vehicle_id: payload.data.vehicleId,
        name: user.user_metadata?.full_name || "Buyer",
        email: user.email,
        phone: user.user_metadata?.phone || "0000000000",
        message: payload.data.content,
        status: "new",
        payload: {
          vendor_id: vehicle.organization_id,
        },
      })
      .select("id")
      .single();

    const { data: newThread, error: threadError } = await supabase
      .from("chat_threads")
      .insert({
        vehicle_id: payload.data.vehicleId,
        buyer_id: user.id,
        lead_id: lead?.id || null,
      })
      .select("id, lead_id")
      .single();
      
    if (threadError) {
      return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
    }
    thread = newThread;
  }

  // Insert the message
  const { data: message, error: messageError } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: thread.id,
      sender_id: user.id,
      content: payload.data.content,
    })
    .select("id")
    .single();

  if (messageError) {
    console.error(`[Message API] Failed to save message:`, messageError);
    return NextResponse.json({ error: "Unable to send message" }, { status: 500 });
  }

  return NextResponse.json({ messageId: message.id }, { status: 201 });
}

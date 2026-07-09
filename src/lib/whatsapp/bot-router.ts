import { createAdminClient } from "@/lib/supabase/admin";
import type { ParsedInboundMessage } from "@/lib/whatsapp/inbound";
import { sendCloudApiText, sendCloudApiInteractive } from "@/lib/whatsapp/cloud-api";

const MAIN_MENU = {
  type: "button",
  header: { type: "text", text: "HireCar Marketplace" },
  body: { text: "Welcome! How can we assist you today?" },
  action: {
    buttons: [
      { type: "reply", reply: { id: "SUPPORT_BTN", title: "Customer Support" } },
      { type: "reply", reply: { id: "INFO_BTN", title: "General Info" } },
    ],
  },
};

export async function handleBotRouting(message: ParsedInboundMessage): Promise<void> {
  const supabase = createAdminClient();
  const phone = message.from;

  // 1. Fetch current session state
  const { data: session, error: sessionError } = await supabase
    .from("whatsapp_sessions")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  // Defensive: if table doesn't exist yet locally, this handles the error gracefully
  if (sessionError && sessionError.code !== "PGRST116") {
    console.warn("Could not fetch whatsapp_sessions (table might be missing)", sessionError);
  }

  const currentState = session?.state || "none";

  // 2. Handle Interactive Button/List replies
  if (message.interactive) {
    const actionId = message.interactive.id;

    if (actionId === "SUPPORT_BTN") {
      await updateSession(phone, "awaiting_support_desc");
      const res = await sendCloudApiText(phone, "Please describe the issue you are facing in a single message, and our support team will get back to you.");
      if (!res.ok) throw new Error(`Failed to send support text: ${res.error}`);
      return;
    }

    if (actionId === "INFO_BTN") {
      await clearSession(phone);
      const res = await sendCloudApiText(
        phone,
        "HireCar Marketplace is Australia's premium platform for booking verified rental vehicles.\n\nBrowse cars: https://www.hirecarmarketplace.com.au/search\nFAQ: https://www.hirecarmarketplace.com.au/about"
      );
      if (!res.ok) throw new Error(`Failed to send info text: ${res.error}`);
      return;
    }
  }

  // 3. Handle free-form text based on current state
  if (message.type === "text" && message.text) {
    if (currentState === "awaiting_support_desc") {
      // Create support ticket
      await supabase.from("support_tickets").insert({
        customer_phone: phone,
        customer_name: message.senderName || "Unknown",
        description: message.text,
        status: "open",
      });

      await clearSession(phone);
      const res = await sendCloudApiText(phone, "Your support ticket has been created successfully. A member of our team will review it shortly.");
      if (!res.ok) throw new Error(`Failed to send support success: ${res.error}`);
      return;
    }

    // Default to main menu if no state and they sent text
    await clearSession(phone);
    const res = await sendCloudApiInteractive(phone, MAIN_MENU);
    if (!res.ok) throw new Error(`Failed to send MAIN_MENU: ${res.error}`);
    return;
  }
}

// Helpers
async function updateSession(phone: string, state: string) {
  const supabase = createAdminClient();
  await supabase.from("whatsapp_sessions").upsert({
    phone,
    state,
    updated_at: new Date().toISOString(),
  });
}

async function clearSession(phone: string) {
  const supabase = createAdminClient();
  await supabase.from("whatsapp_sessions").delete().eq("phone", phone);
}

import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChatInterface } from "@/components/chat-interface";
import { LeaveReviewModal } from "@/components/leave-review-modal";
import { notFound } from "next/navigation";

export default async function CustomerChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  // Fetch lead without customer_email filter so both customers and vendor
  // org members can reach this page. Ownership is verified below.
  const { data: lead } = await supabase
    .from("leads")
    .select(`
      id, customer_email, customer_user_id, vendor_id,
      organizations(name)
    `)
    .eq("id", id)
    .single();

  if (!lead) {
    notFound();
  }

  // Verify the current user is authorized to view this conversation:
  //   (a) UUID match via customer_user_id  — most reliable
  //   (b) email match                      — fallback for leads created before customer_user_id
  //   (c) vendor org membership            — lets vendor staff reply
  const isCustomerById = !!lead.customer_user_id && lead.customer_user_id === user.id;
  const isCustomerByEmail =
    !!profile?.email &&
    lead.customer_email.toLowerCase() === profile.email.toLowerCase();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", lead.vendor_id)
    .eq("user_id", user.id)
    .maybeSingle();
  const isVendorMember = !!membership;

  if (!isCustomerById && !isCustomerByEmail && !isVendorMember) {
    notFound();
  }

  // Fetch existing messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: true });

  const org = lead.organizations as unknown as { name: string } | null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative">
      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          leadId={lead.id}
          currentUserId={user.id}
          initialMessages={messages || []}
          otherPartyName={org?.name || "Vendor"}
          backLink="/messages"
          headerActions={<LeaveReviewModal leadId={lead.id} vendorName={org?.name || "Vendor"} />}
        />
      </div>
    </div>
  );
}

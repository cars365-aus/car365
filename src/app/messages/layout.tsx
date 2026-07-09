import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { ChatSidebar } from "@/components/chat-sidebar";

export const metadata = {
  title: "Messages | Hire Car",
};

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = createAdminClient();

  const [{ data: profile }, { data: orgs }] = await Promise.all([
    supabase.from("profiles").select("email").eq("id", user.id).single(),
    supabase.from("organization_members").select("organization_id").eq("user_id", user.id),
  ]);

  const orgIds = orgs?.map((o) => o.organization_id) || [];
  const profileEmail = profile?.email || "";

  // Build the OR query for the leads the user is a part of
  let orQuery = `customer_user_id.eq.${user.id}`;
  if (profileEmail) {
    orQuery += `,customer_email.eq.${profileEmail}`;
  }
  if (orgIds.length > 0) {
    orQuery += `,vendor_id.in.(${orgIds.join(",")})`;
  }

  // Fetch all conversations
  // We can't do a subquery with limit=1 easily in supabase JS without writing a function or complex view,
  // so we will just fetch the leads and then separately fetch the last messages for them, or just fetch leads without snippets for now.
  // Actually, we can just fetch all messages for these leads and group them, or since the number of chats could be large, just fetch leads.
  const { data: leads } = await supabase
    .from("leads")
    .select(`
      id, customer_name, customer_email, customer_user_id, vendor_id, updated_at, created_at,
      vehicles(title),
      organizations(name)
    `)
    .or(orQuery)
    .order("updated_at", { ascending: false })
    .limit(50);

  // Fetch the latest message for each lead to show a preview snippet
  // We need to define the type explicitly to satisfy TypeScript
  type LeadWithSnippet = typeof leads extends (infer T)[] | null 
    ? T & { lastMessage?: { content: string; created_at: string } | null }
    : never;

  let leadsWithSnippets: LeadWithSnippet[] = leads || [];

  if (leads && leads.length > 0) {
    const leadIds = leads.map(l => l.id);
    const { data: latestMessages } = await supabase
      .from("messages")
      .select("lead_id, content, created_at")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });

    if (latestMessages) {
      // Find the first message for each lead (since it's ordered desc, it will be the latest)
      const lastMessageMap = new Map();
      for (const msg of latestMessages) {
        if (!lastMessageMap.has(msg.lead_id)) {
          lastMessageMap.set(msg.lead_id, msg);
        }
      }

      leadsWithSnippets = leads.map((lead) => ({
        ...lead,
        lastMessage: lastMessageMap.get(lead.id) || null,
      })) as LeadWithSnippet[];
      
      // Sort by last message created_at, or lead created_at
      leadsWithSnippets.sort((a, b) => {
        const dateA = a.lastMessage?.created_at || a.created_at;
        const dateB = b.lastMessage?.created_at || b.created_at;
        return new Date(dateB as string).getTime() - new Date(dateA as string).getTime();
      });
    }
  }

  // Map the data to a generic sidebar format
  const sidebarChats = leadsWithSnippets.map((lead) => {
    type LeadVehicle = { title: string };
    type LeadOrg = { name: string };
    const vehicle = lead.vehicles as unknown as LeadVehicle;
    const org = lead.organizations as unknown as LeadOrg;

    // Determine the other party's name
    // If the current user is a vendor member for this lead, the other party is the customer.
    const isVendorForThisLead = orgIds.includes(lead.vendor_id);
    const otherPartyName = isVendorForThisLead ? (lead.customer_name || "Customer") : (org?.name || "Vendor");
    const otherPartyInitials = otherPartyName.substring(0, 2).toUpperCase();

    return {
      id: lead.id,
      name: otherPartyName,
      initials: otherPartyInitials,
      vehicle: vehicle?.title || "Vehicle Enquiry",
      snippet: lead.lastMessage?.content || "No messages yet.",
      timestamp: lead.lastMessage?.created_at || lead.created_at,
    };
  });

  return (
    <div
      className="flex flex-col bg-white overflow-hidden"
      style={{ height: '100dvh' }}
    >
      <SiteHeader />
      
      {/* Full-screen dual pane layout */}
      <div className="flex flex-1 overflow-hidden w-full min-h-0">
        
        {/* Left Pane: Sidebar */}
        <ChatSidebar chats={sidebarChats} />

        {/* Right Pane: Active Chat */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative min-w-0 border-l border-slate-100">
          {children}
        </div>
      </div>
    </div>
  );
}

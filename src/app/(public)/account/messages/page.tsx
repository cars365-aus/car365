import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

export const metadata = {
  title: "Messages | Cars365",
};

export default async function AccountMessagesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: threads } = await supabase
    .from("chat_threads")
    .select(`
      id, created_at, updated_at,
      vehicles (id, title, slug, make, model),
      chat_messages (content, created_at)
    `)
    .eq("buyer_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Messages</h1>
      
      {!threads || threads.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p>You have no messages yet.</p>
          <Link href="/used-cars" className="text-blue-600 hover:underline mt-2 inline-block">
            Find a vehicle and get in touch
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread: any) => {
            const msgs = thread.chat_messages || [];
            const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : null;
            
            return (
              <Link 
                key={thread.id} 
                href={`/account/messages/${thread.id}`}
                className="block border border-slate-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-900">
                    {thread.vehicles?.title || "General Inquiry"}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {new Date(thread.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {lastMessage ? (
                  <p className="text-sm text-slate-600 line-clamp-1">
                    {lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No messages yet</p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}

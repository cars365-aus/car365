"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ThreadPage({ params }: { params: { id: string } }) {
  const [thread, setThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/sign-in");
        return;
      }

      const { data: threadData } = await supabase
        .from("chat_threads")
        .select("*, vehicles(title, slug, make, model)")
        .eq("id", params.id)
        .single();
        
      if (!threadData) {
        router.push("/account/messages");
        return;
      }
      
      setThread(threadData);

      const { data: msgData } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", params.id)
        .order("created_at", { ascending: true });
        
      setMessages(msgData || []);
      setLoading(false);
    }
    
    load();
  }, [params.id, router, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !thread) return;
    
    setSending(true);
    try {
      const res = await fetch("/api/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: thread.vehicle_id,
          content: newMessage
        }),
      });
      
      if (!res.ok) throw new Error("Failed to send");
      
      // Reload messages (or ideally just append optimistically)
      const { data: msgData } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", params.id)
        .order("created_at", { ascending: true });
        
      setMessages(msgData || []);
      setNewMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <Link href="/account/messages" className="text-slate-400 hover:text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">
          {thread?.vehicles?.title || "Conversation"}
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 rounded-lg border border-slate-100 mb-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col max-w-[80%] ${msg.sender_id === thread.buyer_id ? "ml-auto items-end" : "mr-auto items-start"}`}
          >
            <div 
              className={`px-4 py-2 rounded-2xl ${
                msg.sender_id === thread.buyer_id 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
            <span className="text-xs text-slate-400 mt-1">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-slate-400 my-8">No messages yet.</p>
        )}
      </div>
      
      <form onSubmit={handleSend} className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[50px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <Button type="submit" disabled={sending || !newMessage.trim()} className="h-auto px-6">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

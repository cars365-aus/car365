"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/actions/chat";
import { Send, Loader2, Lock, CheckCheck, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Message = {
  id: string;
  lead_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

interface ChatInterfaceProps {
  leadId: string;
  currentUserId: string;
  initialMessages: Message[];
  otherPartyName: string;
  backLink?: string;
  headerActions?: React.ReactNode;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(date1: string, date2: string) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(dateString, today.toISOString())) {
    return "Today";
  } else if (isSameDay(dateString, yesterday.toISOString())) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  }
}

// Subtle chat background pattern
const ChatBg = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="chat-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r="1.5" fill="#94a3b8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#chat-dots)" />
  </svg>
);

export function ChatInterface({ leadId, currentUserId, initialMessages, otherPartyName, backLink, headerActions }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingMessageIds, setPendingMessageIds] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [supabase] = useState(() => createClient());

  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string; messages: (Message & { isConsecutive: boolean; isLastInGroup: boolean })[] }[] = [];
    
    messages.forEach((msg, index) => {
      const dateLabel = formatDateLabel(msg.created_at);
      let group = groups.find((g) => g.dateLabel === dateLabel);
      if (!group) {
        group = { dateLabel, messages: [] };
        groups.push(group);
      }

      const prevMsg = index > 0 ? messages[index - 1] : null;
      const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

      const isConsecutive = prevMsg ? prevMsg.sender_user_id === msg.sender_user_id && isSameDay(prevMsg.created_at, msg.created_at) : false;
      const isLastInGroup = !nextMsg || nextMsg.sender_user_id !== msg.sender_user_id || !isSameDay(msg.created_at, nextMsg.created_at);

      group.messages.push({ ...msg, isConsecutive, isLastInGroup });
    });

    return groups;
  }, [messages]);

  const scrollToBottom = (force = false) => {
    if (!scrollContainerRef.current || !messagesEndRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (force || scrollHeight - scrollTop - clientHeight < 200) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat_${leadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `lead_id=eq.${leadId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [leadId, supabase]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const tempBody = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    setNewMessage(""); 
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    
    const optimisticMessage: Message = {
      id: tempId,
      lead_id: leadId,
      sender_user_id: currentUserId,
      body: tempBody,
      created_at: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setPendingMessageIds((prev) => new Set(prev).add(tempId));
    setIsSending(true);
    
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const { data, error } = await sendMessage(leadId, tempBody);
      if (error) {
        toast.error(error);
        setNewMessage(tempBody);
        setMessages((prev) => prev.filter(m => m.id !== tempId));
      } else if (data) {
        setMessages((prev) => prev.map(m => m.id === tempId ? data : m));
      }
    } finally {
      setIsSending(false);
      setPendingMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const otherInitials = getInitials(otherPartyName);

  return (
    <div className="fixed inset-0 z-50 md:relative md:inset-auto md:z-auto flex flex-col h-[100dvh] md:h-full w-full overflow-hidden">
      
      {/* Premium Header */}
      <div className="bg-card border-b border-border px-4 sm:px-5 py-3 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          {backLink && (
            <Link href={backLink} className="md:hidden -ml-1 p-2 rounded-xl hover:bg-muted text-slate-600 transition-all active:scale-95">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          )}
          {/* Rounded-square avatar */}
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-[10px] bg-gradient-to-br from-primary to-[#c2410c] flex items-center justify-center text-white font-extrabold text-sm shadow-[0_3px_10px_rgba(234,88,12,0.3)]">
              {otherInitials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
          </div>
          <div>
            <div className="font-semibold text-foreground text-[15px] leading-tight tracking-tight">{otherPartyName}</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">● Online · Replies quickly</p>
          </div>
        </div>
        
        {/* Right actions */}
        <div className="flex items-center gap-2">
          {headerActions}
        </div>
      </div>

      {/* Messages Area with subtle pattern */}
      <div className="flex-1 overflow-hidden relative bg-muted">
        <ChatBg />
        <div 
          ref={scrollContainerRef} 
          className="absolute inset-0 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col scroll-smooth"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
        >
          {/* Encryption notice */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-1.5 bg-card/80 border border-border/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <Lock className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">End-to-end encrypted</span>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 py-16">
              <div className="relative">
                <div className="h-24 w-24 rounded-3xl bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex items-center justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                    <Send className="h-7 w-7 text-primary translate-x-0.5" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-heading font-bold text-foreground text-lg">Start the conversation</h3>
                <p className="text-muted-foreground text-sm mt-1.5 max-w-[200px] leading-relaxed">Send a message to connect with {otherPartyName}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 justify-end gap-0">
              {groupedMessages.map((group) => (
                <div key={group.dateLabel} className="flex flex-col w-full mb-6">
                  {/* Date separator */}
                  <div className="flex items-center justify-center mb-5">
                    <div className="bg-card/90 border border-border/60 backdrop-blur-sm shadow-sm px-4 py-1.5 rounded-full">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {group.dateLabel}
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex flex-col gap-0.5">
                    {group.messages.map((msg) => {
                      const isMe = msg.sender_user_id === currentUserId;
                      const isPending = pendingMessageIds.has(msg.id);
                      
                      return (
                        <div 
                          key={msg.id} 
                          className={`
                            flex w-full items-end gap-2
                            ${isMe ? "justify-end" : "justify-start"}
                            ${!msg.isConsecutive ? "mt-5" : "mt-0.5"}
                          `}
                        >
                          {/* Other person's avatar */}
                          {!isMe && (
                            <div className="shrink-0 self-end mb-1">
                              {msg.isLastInGroup ? (
                                <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center text-slate-600 font-bold text-[10px]">
                                  {otherInitials}
                                </div>
                              ) : (
                                <div className="w-7" />
                              )}
                            </div>
                          )}

                          {/* Message bubble */}
                          <div className={`
                            flex flex-col max-w-[78%] sm:max-w-[65%]
                            ${isMe ? "items-end" : "items-start"}
                          `}>
                            <div className={`
                              px-4 py-2.5 text-[14px] leading-[1.5] break-words whitespace-pre-wrap
                              transition-all duration-200
                              ${isPending ? "opacity-60" : "opacity-100"}
                              ${isMe 
                                ? `bg-primary text-white font-medium
                                   ${msg.isConsecutive && msg.isLastInGroup ? "rounded-l-2xl rounded-tr-md rounded-br-2xl"
                                     : !msg.isConsecutive && !msg.isLastInGroup ? "rounded-l-2xl rounded-t-2xl rounded-br-md"
                                     : msg.isConsecutive && !msg.isLastInGroup ? "rounded-l-2xl rounded-r-md"
                                     : "rounded-2xl rounded-br-md"
                                   }
                                   shadow-[0_2px_8px_rgba(234,88,12,0.2)]`
                                : `bg-card text-foreground
                                   ${msg.isConsecutive && msg.isLastInGroup ? "rounded-r-2xl rounded-tl-md rounded-bl-2xl"
                                     : !msg.isConsecutive && !msg.isLastInGroup ? "rounded-r-2xl rounded-t-2xl rounded-bl-md"
                                     : msg.isConsecutive && !msg.isLastInGroup ? "rounded-r-2xl rounded-l-md"
                                     : "rounded-2xl rounded-bl-md"
                                   }
                                   border border-border shadow-[0_1px_4px_rgba(0,0,0,0.04)]`
                              }
                            `}>
                              {msg.body}
                            </div>
                            
                            {/* Time + status */}
                            {msg.isLastInGroup && (
                              <div className={`flex items-center gap-1 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  {formatTime(msg.created_at)}
                                </span>
                                {isMe && (
                                  isPending 
                                    ? <Loader2 className="h-3 w-3 text-slate-400 animate-spin" />
                                    : <CheckCheck className="h-3.5 w-3.5 text-primary" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} className="h-2 shrink-0" />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-card border-t border-border px-4 sm:px-5 py-3.5 z-20 flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto">
          {/* Textarea wrapper */}
          <div className="flex-1 bg-muted border border-border rounded-2xl focus-within:bg-card focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/[0.08] transition-all duration-200">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className="w-full resize-none bg-transparent px-4 py-3 text-base md:text-[14px] text-foreground placeholder:text-slate-400 focus:outline-none leading-relaxed max-h-[160px] font-medium"
              disabled={isSending}
              style={{ minHeight: '46px' }}
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="
              flex h-[46px] w-[46px] shrink-0 items-center justify-center
              rounded-2xl bg-primary text-white
              hover:bg-[#c2410c] hover:shadow-[0_4px_16px_rgba(234,88,12,0.35)]
              active:scale-95
              disabled:opacity-40 disabled:hover:shadow-none disabled:hover:bg-primary disabled:active:scale-100
              transition-all duration-200 shadow-[0_2px_8px_rgba(234,88,12,0.2)]
            "
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 translate-x-0.5" />
            )}
          </button>
        </form>

        {/* Keyboard hint - desktop only */}
        <p className="text-center mt-2.5 hidden md:block text-[10px] text-slate-400 font-medium">
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-sans">Enter</kbd>
          {" to send · "}
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-sans">Shift + Enter</kbd>
          {" for new line"}
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Search, MessageCircle } from "lucide-react";
import { useState, useMemo } from "react";

interface ChatThread {
  id: string;
  name: string;
  initials: string;
  vehicle: string;
  snippet: string;
  timestamp: string;
}

interface ChatSidebarProps {
  chats: ChatThread[];
}

export function ChatSidebar({ chats }: ChatSidebarProps) {
  const params = useParams();
  const activeChatId = params.id as string | undefined;
  
  const [search, setSearch] = useState("");

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.vehicle.toLowerCase().includes(q)
    );
  }, [chats, search]);

  // On mobile, hide the sidebar if inside a chat room
  const isMobileHidden = !!activeChatId;

  return (
    <div className={`
      ${isMobileHidden ? 'hidden md:flex' : 'flex'}
      flex-col w-full md:w-[320px] lg:w-[360px] flex-shrink-0 bg-card border-r border-border h-full
    `}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="font-heading text-xl font-bold text-foreground">Messages</div>
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted border border-border/80 rounded-2xl pl-10 pr-4 py-2.5 text-base md:text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-card transition-all"
          />
        </div>
      </div>

      {/* Section Label */}
      <div className="px-5 mb-2">
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          {filteredChats.length} Conversation{filteredChats.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin scrollbar-thumb-slate-100">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
            <MessageCircle className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-medium">No conversations found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredChats.map((chat) => {
              const isActive = activeChatId === chat.id;
              
              const date = new Date(chat.timestamp);
              const isToday = new Date().toDateString() === date.toDateString();
              const timeString = isToday 
                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <Link 
                  key={chat.id} 
                  href={`/messages/${chat.id}`}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-white shadow-[0_4px_16px_rgba(234,88,12,0.2)]' 
                      : 'hover:bg-muted text-foreground'
                    }
                  `}
                >
                  {/* Avatar */}
                  <div className={`
                    h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0
                    ${isActive 
                      ? 'bg-card/20 text-white' 
                      : 'bg-muted text-slate-600'
                    }
                  `}>
                    {chat.initials}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <div className={`text-[14px] font-semibold truncate ${isActive ? 'text-white' : 'text-foreground'}`}>
                        {chat.name}
                      </div>
                      <span className={`text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                        {timeString}
                      </span>
                    </div>
                    <div className="flex flex-col mt-0.5 gap-0">
                      <span className={`text-[11px] font-semibold truncate ${isActive ? 'text-white/90' : 'text-slate-600'}`}>
                        {chat.vehicle}
                      </span>
                      <span className={`text-xs truncate ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                        {chat.snippet}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

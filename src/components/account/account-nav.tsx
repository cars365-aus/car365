"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tag, MessageSquare, User, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/account/offers", label: "My Offers", icon: Tag },
  { href: "/account/messages", label: "Messages", icon: MessageSquare },
];

export function AccountNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-72 shrink-0">
      <div className="bg-card rounded-2xl shadow-md border border-border/50 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10 pointer-events-none" />
        <div className="relative p-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-sm flex items-center justify-center shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg text-foreground truncate">My Account</h2>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
        </div>
        
        <div className="relative p-4 space-y-1 bg-card">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  active 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                    : "text-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
                  {item.label}
                </div>
                {!active && <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-300" />}
              </Link>
            );
          })}
        </div>
        
        <div className="relative p-4 bg-muted/30 border-t border-border/50">
          <form action="/auth/sign-out" method="post">
            <Button variant="ghost" className="w-full justify-start text-danger hover:text-danger hover:bg-danger/10 group rounded-xl" size="sm">
              <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}

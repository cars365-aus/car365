"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tag, MessageSquare, User, LogOut, ChevronRight, Car, Heart, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const SELLER_NAV = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/listings", label: "My Listings", icon: Car },
  { href: "/account/messages", label: "Messages", icon: MessageSquare },
];

const BUYER_NAV = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/offers", label: "My Offers", icon: Tag },
  { href: "/account/saved", label: "Saved Cars", icon: Heart },
  { href: "/account/messages", label: "Messages", icon: MessageSquare },
];

export function AccountNav({ email, userType }: { email: string; userType: "seller" | "buyer" }) {
  const pathname = usePathname();
  const navItems = userType === "seller" ? SELLER_NAV : BUYER_NAV;

  return (
    <aside className="w-full md:w-72 shrink-0">
      <div className="glass-panel rounded-3xl shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary-hover text-black shadow-[0_0_20px_rgba(255,204,0,0.4)] flex items-center justify-center shrink-0">
              <User className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-xl text-foreground truncate">My Account</h2>
              <p className="text-sm text-muted-foreground truncate">{email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-primary">
                {userType}
              </span>
            </div>
          </div>
        </div>
        
        <div className="relative p-4 space-y-2 bg-transparent">
          {navItems.map((item) => {
            const active = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/account");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 ${
                  active 
                    ? "bg-primary text-black shadow-[0_0_20px_rgba(255,204,0,0.3)] scale-[1.02]" 
                    : "text-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${active ? "text-black" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
                  {item.label}
                </div>
                {!active && <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-300" />}
              </Link>
            );
          })}
        </div>
        
        <div className="relative p-4 bg-black/20 border-t border-white/10">
          <form action="/auth/sign-out" method="post">
            <Button variant="ghost" className="w-full justify-start text-danger hover:text-danger hover:bg-danger/10 group rounded-2xl font-bold" size="default">
              <LogOut className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}

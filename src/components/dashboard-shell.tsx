"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  GitBranch,
  Car,
  MessageSquare,
  BarChart3,
  CreditCard,
  Settings,
  LayoutGrid,
  Users,
  List,
  AlertTriangle,
  ClipboardList,
  Star,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Megaphone,
  Shield,
  UserCog,
  FileText,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { BrandLogo } from "@/components/brand-logo";

const vendorLinks = [
  { label: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
  { label: "Branches", href: "/vendor/branches", icon: GitBranch },
  { label: "Vehicles", href: "/vendor/vehicles", icon: Car },
  { label: "Leads", href: "/vendor/leads", icon: MessageSquare },
  { label: "Analytics", href: "/vendor/analytics", icon: BarChart3 },
  { label: "Billing", href: "/vendor/billing", icon: CreditCard },
  { label: "Settings", href: "/vendor/settings", icon: Settings },
];

const adminLinks = [
  { label: "Overview", href: "/admin", icon: LayoutGrid, roles: ["moderator", "support", "finance", "super_admin"] },
  { label: "Vendors", href: "/admin/vendors", icon: Users, roles: ["moderator", "super_admin"] },
  { label: "Branches", href: "/admin/branches", icon: GitBranch, roles: ["moderator", "super_admin"] },
  { label: "Listings", href: "/admin/listings", icon: List, roles: ["moderator", "super_admin"] },
  { label: "Featured", href: "/admin/featured", icon: Star, roles: ["moderator", "super_admin"] },
  { label: "Leads", href: "/admin/leads", icon: MessageSquare, roles: ["support", "super_admin"] },
  { label: "Billing", href: "/admin/billing", icon: CreditCard, roles: ["finance", "super_admin"] },
  { label: "Reviews", href: "/admin/reviews", icon: ClipboardList, roles: ["support", "super_admin"] },
  { label: "Fraud", href: "/admin/fraud", icon: AlertTriangle, roles: ["moderator", "super_admin"] },
  { label: "Audit", href: "/admin/audit", icon: ClipboardList, roles: ["super_admin"] },
  { label: "Marketing", href: "/admin/marketing", icon: Megaphone, roles: ["super_admin"] },
  { label: "Blog", href: "/admin/blog", icon: FileText, roles: ["super_admin"] },
  { label: "Roles", href: "/admin/roles", icon: UserCog, roles: ["owner", "admin", "super_admin"] },
  { label: "WhatsApp", href: "/admin/whatsapp", icon: MessageSquare, roles: ["support", "super_admin"] },
  { label: "Settings", href: "/admin/settings", icon: Settings, roles: ["super_admin"] },
];

function ProfileDropdown({ onLogout, email, initial }: { onLogout: () => void, email: string, initial: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-2 bg-muted hover:bg-muted border border-border rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {initial}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 rounded-2xl glass-panel shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-4 border-b border-border/50 bg-muted/30">
            <p className="text-sm font-bold text-foreground">Signed In As</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">{email}</p>
          </div>
          <div className="p-2">
            <Link href="/vendor/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-muted hover:text-foreground rounded-xl transition-colors">
              <Settings className="h-4 w-4 text-slate-400" />
              Account Settings
            </Link>
          </div>
          <div className="p-2 border-t border-border">
            <button onClick={onLogout} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link?: string | null;
};

function NotificationDropdown({ 
  mode, 
  initialNotifications = [], 
  orgId 
}: { 
  mode: "vendor" | "admin",
  initialNotifications?: DashboardNotification[],
  orgId?: string | null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>(initialNotifications);
  const [hasFetched, setHasFetched] = useState(initialNotifications.length > 0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!orgId || hasFetched) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, type, read, created_at, link")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (data) {
      setNotifications(data);
    }
    setHasFetched(true);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!orgId || unreadCount === 0) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    await supabase.from("notifications").update({ read: true }).eq("organization_id", orgId).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
      markAllRead();
    }
  };

  const typeIcon: Record<string, string> = { info: "🔔", success: "✅", warning: "⚠️", error: "🚨" };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2.5 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted rounded-full transition-colors border border-transparent hover:border-border focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 rounded-2xl glass-panel shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">{unreadCount} new</span>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (n.link) window.location.href = n.link; setIsOpen(false); }}
                  className={`p-4 border-b border-slate-50 hover:bg-muted transition-colors cursor-pointer group ${!n.read ? "bg-orange-50/40" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-base">
                      {typeIcon[n.type] ?? "🔔"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1.5 uppercase tracking-wider">
                        {new Date(n.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-border bg-muted/50">
            <Link
              href={mode === "vendor" ? "/vendor/leads" : "/admin/audit"}
              onClick={() => setIsOpen(false)}
              className="block w-full text-center px-3 py-2.5 text-xs font-semibold text-slate-600 hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            >
              View all activity
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardShell({
  children,
  mode,
  isAdmin = false,
  adminRole,
  userEmail,
  orgId,
  initialNotifications,
}: {
  children: ReactNode;
  mode: "vendor" | "admin";
  isAdmin?: boolean;
  adminRole?: string;
  userEmail?: string;
  orgId?: string;
  initialNotifications?: DashboardNotification[];
}) {
  const pathname = usePathname();
  let baseLinks = mode === "vendor" ? vendorLinks : adminLinks;
  
  if (mode === "admin" && adminRole) {
    if (["super_admin", "admin", "owner"].includes(adminRole)) {
      baseLinks = adminLinks;
    } else {
      baseLinks = adminLinks.filter(link => !link.roles || link.roles.includes(adminRole));
    }
  }
  
  const links = mode === "vendor" && isAdmin 
    ? [...baseLinks, { label: "Admin Portal", href: "/admin", icon: Shield }]
    : baseLinks;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close drawer on route change
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setDrawerOpen(false);
    }
  }, [pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!drawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // Focus trap inside drawer
  useEffect(() => {
    if (!drawerOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [drawerOpen]);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isLinkActive = useCallback(
    (href: string) => {
      if (mode === "vendor" && href === "/vendor/dashboard") {
        return pathname === href;
      }
      if (mode === "admin" && href === "/admin") {
        return pathname === href;
      }
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname, mode]
  );

  const navContent = (
    <>
      <div className="mb-4 px-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          Navigation
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {links.map(({ label, href, icon: Icon }) => {
          const isActive = isLinkActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-xl px-4 min-h-[44px] text-sm font-bold transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-orange-50 to-amber-50/30 text-primary shadow-sm relative overflow-hidden"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:shadow-sm"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-amber-500 rounded-r-md shadow-[0_0_8px_rgba(234,88,12,0.6)]"></span>
              )}
              <Icon className={`h-5 w-5 shrink-0 transition-all duration-300 ${isActive ? "scale-110 drop-shadow-md text-primary" : "group-hover:scale-110 group-hover:text-muted-foreground"}`} />
              <span className="transform transition-transform duration-300 group-hover:translate-x-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/50 relative selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-50/40 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b-0 shadow-sm">
        <div className="mx-auto flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger button */}
            <button
              ref={triggerRef}
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-slate-600 hover:bg-muted hover:text-foreground transition-colors md:hidden"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link
              href="/"
              className="flex items-center gap-3 group"
            >
              <BrandLogo
                priority
                className="h-[44px] w-[140px] transition-transform duration-300 group-hover:scale-105 sm:h-[52px] sm:w-[180px]"
                imageClassName="object-left mix-blend-multiply"
              />
              <span className="hidden rounded-full bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-orange-700 sm:block">
                {mode === "admin" ? "Admin" : "Vendor"}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#ea580c] transition-colors bg-card hover:bg-orange-50 px-4 py-2 rounded-xl border border-border hover:border-orange-200 shadow-sm group"
            >
              <span>Public marketplace</span>
              <ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            
            <NotificationDropdown mode={mode} initialNotifications={initialNotifications} orgId={orgId} />
            
            {/* Custom Dropdown */}
            <ProfileDropdown 
              onLogout={handleLogout} 
              email={userEmail ?? "Account"} 
              initial={userEmail ? userEmail.charAt(0).toUpperCase() : "U"} 
            />
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          aria-hidden="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setDrawerOpen(false);
              triggerRef.current?.focus();
            }}
          />
          {/* Drawer panel */}
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`${mode === "admin" ? "Admin" : "Vendor"} navigation`}
            className="absolute left-0 top-0 h-full w-[280px] max-w-[80vw] glass-panel bg-card/90 shadow-2xl animate-in slide-in-from-left duration-300"
          >
            <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <BrandLogo
                  priority
                  className="h-[40px] w-[120px]"
                  imageClassName="object-left mix-blend-multiply"
                />
                <span className="sr-only">
                  {mode === "admin" ? "Admin Panel" : "Vendor Portal"}
                </span>
              </div>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  triggerRef.current?.focus();
                }}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-4 h-[calc(100vh-73px)] overflow-y-auto">
              {navContent}
            </nav>
          </div>
        </div>
      )}

      {/* Main layout with sidebar */}
      <div
        className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8"
        inert={drawerOpen || undefined}
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-[260px] shrink-0">
            <div className="sticky top-24 rounded-3xl glass-panel bg-card/40 p-4 h-[calc(100vh-8rem)] overflow-y-auto hidden-scrollbar">
              <nav>{navContent}</nav>
            </div>
          </aside>

          {/* Content area */}
          <main className="min-w-0 w-full flex-1">{children}</main>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hidden-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}

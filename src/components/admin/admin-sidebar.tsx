"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Store, 
  Car, 
  ShieldAlert, 
  Star, 
  CreditCard,
  LogOut,
  Settings
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const navigation = [
  { name: "Control Room", href: "/admin", icon: LayoutDashboard },
  { name: "Vendors", href: "/admin/vendors", icon: Store },
  { name: "Listings", href: "/admin/listings", icon: Car },
  { name: "Fraud Flags", href: "/admin/fraud", icon: ShieldAlert },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card px-4 py-6 text-foreground">
      <Link href="/" className="mb-8 flex items-center px-2">
        <BrandLogo className="h-[48px] w-[180px]" imageClassName="object-left mix-blend-multiply" />
        <span className="sr-only">Cars365 Admin</span>
      </Link>

      <nav className="flex-1 space-y-1.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1.5 pt-6 border-t border-border">
        <Link
          href="/admin/settings"
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          Platform Settings
        </Link>
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

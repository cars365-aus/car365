import Link from "next/link";
import { requireUser } from "@/lib/security/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LayoutDashboard, MessageCircle, Settings, LogOut, Heart, Shield } from "lucide-react";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const { userHasAdminAccess } = await import("@/lib/security/auth");
  const isAdmin = await userHasAdminAccess(user);

  const navItems = [
    { name: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
    { name: "My Enquiries", href: "/customer/enquiries", icon: MessageCircle },
    { name: "Saved", href: "/customer/saved", icon: Heart },
    { name: "Settings", href: "/customer/settings", icon: Settings },
    ...(isAdmin ? [{ name: "Admin Portal", href: "/admin", icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          {/* Sidebar — horizontal scrollable tab strip on mobile, vertical rail on desktop */}
          <aside className="md:w-64 shrink-0">
            <nav
              className="flex md:flex-col gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 md:mx-0 md:px-0 md:pb-0 md:overflow-visible"
              aria-label="Account navigation"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex shrink-0 items-center gap-2 md:gap-3 rounded-xl px-4 py-2.5 md:py-3 text-sm font-medium text-slate-700 whitespace-nowrap bg-white md:bg-transparent border border-slate-200 md:border-0 shadow-sm md:shadow-none hover:bg-white hover:text-amber-600 hover:shadow-sm transition-all"
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Sign out — inline pill on mobile, divided block on desktop */}
              <form action="/auth/sign-out" method="post" className="shrink-0 md:mt-8 md:pt-6 md:border-t md:border-slate-200 md:w-full">
                <button type="submit" className="flex w-full items-center gap-2 md:gap-3 rounded-xl px-4 py-2.5 md:py-3 text-sm font-medium text-slate-500 whitespace-nowrap border border-slate-200 md:border-0 hover:bg-slate-100 hover:text-slate-900 transition-all">
                  <LogOut className="h-4.5 w-4.5 shrink-0" />
                  Sign Out
                </button>
              </form>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {children}
          </main>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

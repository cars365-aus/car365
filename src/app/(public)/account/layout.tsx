import { ReactNode } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: { children: ReactNode }) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-50 flex flex-col pt-8 md:pt-16 pb-16">
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl flex-grow">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-10">
          
          <AccountNav email={user.email ?? ""} />

          <main className="flex-1 min-w-0">
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 md:p-8 min-h-[500px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10">
                {children}
              </div>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}

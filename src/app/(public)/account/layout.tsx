import { ReactNode } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  const userType = user.user_metadata?.user_type === "seller" ? "seller" : "buyer";

  return (
    <div className="min-h-screen bg-black flex flex-col pt-8 md:pt-16 pb-16 relative overflow-hidden bg-noise">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl flex-grow relative z-10">
        
        {/* Back Button & Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Marketplace
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-10">
          <AccountNav email={user.email ?? ""} userType={userType} />

          <main className="flex-1 min-w-0">
            <div className="glass-panel rounded-3xl p-6 md:p-8 min-h-[600px] relative overflow-hidden shadow-2xl">
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
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

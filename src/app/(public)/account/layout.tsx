import { ReactNode } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-slate-50 flex flex-col pt-16">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex flex-col md:flex-row gap-8">
          
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-semibold text-lg mb-4 text-slate-800">My Account</h2>
              <div className="space-y-1">
                <Link
                  href="/account/offers"
                  className="block px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  My Offers
                </Link>
                <Link
                  href="/account/messages"
                  className="block px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  Messages
                </Link>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-sm text-slate-500 truncate mb-4">{user.email}</p>
                <form action="/auth/sign-out" method="post">
                  <Button variant="outline" className="w-full justify-start text-slate-600" size="sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </form>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
              {children}
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Car, Clock, Tag } from "lucide-react";

export const metadata = {
  title: "My Offers | Cars365",
};

export default async function AccountOffersPage() {
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

  const { data: bids } = await supabase
    .from("bids")
    .select(`
      id, amount, status, created_at, message,
      vehicles (id, title, slug, make, model)
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 border-b border-border/50 pb-6">
        <div className="p-2.5 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl shadow-sm text-white">
          <Tag className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Offers</h1>
          <p className="text-sm text-muted-foreground mt-1">Track the status of your offers on vehicles.</p>
        </div>
      </div>
      
      {!bids || bids.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
            <Car className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No offers yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">You haven't made any offers on our vehicles. Browse our inventory to find your next car.</p>
          <Link 
            href="/used-cars" 
            className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full hover:bg-primary-hover hover:scale-[1.02] transition-all shadow-md shadow-primary/20"
          >
            Browse Vehicles
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bids.map((bid: any) => (
            <div key={bid.id} className="group relative bg-card border border-border/50 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30 flex flex-col sm:flex-row justify-between sm:items-center gap-6">
              
              <div className="space-y-3 flex-1 min-w-0">
                <div>
                  <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                    <Link href={`/used-cars/${bid.vehicles?.make}/${bid.vehicles?.model}/${bid.vehicles?.slug}`} className="before:absolute before:inset-0">
                      {bid.vehicles?.title}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" />
                    Submitted {new Date(bid.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                
                {bid.message && (
                  <div className="bg-muted/40 rounded-xl p-3 border border-border/40">
                    <p className="text-sm text-muted-foreground italic leading-relaxed">"{bid.message}"</p>
                  </div>
                )}
              </div>
              
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-border/50 pt-4 sm:pt-0 sm:pl-6">
                <div className="text-2xl font-black tracking-tight text-foreground">
                  ${bid.amount.toLocaleString()}
                </div>
                <Badge 
                  className={`px-3 py-1 font-bold tracking-wide uppercase text-[10px] ${
                    bid.status === "accepted" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-transparent" :
                    bid.status === "rejected" ? "bg-red-100 text-red-800 hover:bg-red-200 border-transparent" :
                    "bg-amber-100 text-amber-800 hover:bg-amber-200 border-transparent"
                  }`}
                >
                  {bid.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

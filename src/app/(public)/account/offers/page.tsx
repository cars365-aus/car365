import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Offers</h1>
      
      {!bids || bids.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>You haven't made any offers yet.</p>
          <Link href="/used-cars" className="text-blue-600 hover:underline mt-2 inline-block">
            Browse Vehicles
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid: any) => (
            <div key={bid.id} className="border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h3 className="font-medium text-slate-900">
                  <Link href={`/used-cars/${bid.vehicles?.make}/${bid.vehicles?.model}/${bid.vehicles?.slug}`} className="hover:text-blue-600">
                    {bid.vehicles?.title}
                  </Link>
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Submitted on {new Date(bid.created_at).toLocaleDateString()}
                </p>
                {bid.message && (
                  <p className="text-sm text-slate-600 mt-3 italic border-l-2 pl-3 border-slate-200">"{bid.message}"</p>
                )}
              </div>
              
              <div className="flex items-center gap-4 md:flex-col md:items-end">
                <div className="text-xl font-bold text-slate-800">${bid.amount.toLocaleString()}</div>
                <Badge 
                  variant={
                    bid.status === "accepted" ? "default" :
                    bid.status === "rejected" ? "destructive" :
                    "outline"
                  }
                >
                  {bid.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

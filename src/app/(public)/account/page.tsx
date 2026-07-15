import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SellerOverview } from "@/components/account/seller-overview";
import { BuyerOverview } from "@/components/account/buyer-overview";

export default async function AccountPage() {
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

  if (userType === "seller") {
    return <SellerOverview />;
  }

  return <BuyerOverview />;
}

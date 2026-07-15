import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  type AuthRole,
  resolvePostAuthDestination,
} from "@/lib/routing";
import { sendWelcomeEmail } from "@/lib/email/ses";
import { deriveProfileFromUser } from "@/lib/auth/profile";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");
  const rawRole = requestUrl.searchParams.get("role");
  const plan = requestUrl.searchParams.get("plan");
  const intent = requestUrl.searchParams.get("intent");

  const role: AuthRole | null =
    rawRole === "customer" || rawRole === "vendor" ? rawRole : null;

  const next = resolvePostAuthDestination(role, rawNext, plan);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth exchange failed:", error.message);
      return NextResponse.redirect(
        new URL("/auth/sign-in?error=auth_failed", requestUrl.origin),
      );
    }

    if (data.user) {
      const admin = createAdminClient();

      // Check if this is a brand-new user (no existing profile row)
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      const isNewUser = !existingProfile;

      await admin.from("profiles").upsert(deriveProfileFromUser(data.user));

      // Send welcome email for brand-new registrations (non-blocking)
      if (isNewUser && data.user.email) {
        const name =
          data.user.user_metadata?.full_name ??
          data.user.user_metadata?.name ??
          data.user.email.split("@")[0];
        sendWelcomeEmail({
          to: data.user.email,
          name,
          role: role ?? "customer",
        }).catch((err) => console.error("[Auth Callback] Welcome email failed:", err));
      }
    }
  }

  // Handle explicit intent switching (e.g. Buyer logging into Seller portal)
  if (intent === "buyer" || intent === "seller") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 1. Update DB metadata silently (best effort)
      if (user.user_metadata?.user_type !== intent) {
        console.log(`[Auth Callback] Switching intent to ${intent} for user ${user.id}`);
        const admin = createAdminClient();
        await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, user_type: intent } });
      }

      // 2. The bulletproof fix: set an explicit active_role cookie for the UI
      const response = NextResponse.redirect(new URL(next || "/account", requestUrl.origin));
      response.cookies.set("active_role", intent, { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
      return response;
    }
  }

  return NextResponse.redirect(new URL(next || "/account", requestUrl.origin));
}

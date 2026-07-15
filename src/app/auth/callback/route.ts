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
  const destination = next || "/account";

  const supabase = await createClient();

  // ─── OAuth Code Exchange ──────────────────────────────────────────────────
  // This block only runs when Google (or another OAuth provider) redirects back
  // with a one-time `code`. Email/password sign-ins do NOT pass a code here.
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth exchange failed:", error.message);
      return NextResponse.redirect(
        new URL("/auth/sign-in?error=auth_failed", requestUrl.origin),
      );
    }

    if (data.user) {
      const admin = createAdminClient();

      // Upsert profile and send welcome email for brand-new users
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      const isNewUser = !existingProfile;
      await admin.from("profiles").upsert(deriveProfileFromUser(data.user));

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

      // If intent supplied via OAuth, persist the role via admin client
      if (
        (intent === "buyer" || intent === "seller") &&
        data.user.user_metadata?.user_type !== intent
      ) {
        await admin.auth.admin.updateUserById(data.user.id, {
          user_metadata: { ...data.user.user_metadata, user_type: intent },
        });
      }
    }
  }

  // ─── Set active_role cookie ───────────────────────────────────────────────
  // This runs for BOTH OAuth (after code exchange above) and email/password
  // (where the browser session is already established, no code needed).
  // getUser() reads the session cookie that Supabase set on the browser.
  if (intent === "buyer" || intent === "seller") {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const response = NextResponse.redirect(new URL(destination, requestUrl.origin));
      response.cookies.set("active_role", intent, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    // Edge case: email/password session cookie hasn't propagated to server yet.
    // Fall through to plain redirect; the layout will use metadata as fallback.
    console.warn("[Auth Callback] intent set but getUser() returned null — session not yet propagated");
  }

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}

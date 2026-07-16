import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSafeRedirectPath } from "@/lib/routing";
import { sendWelcomeEmail } from "@/lib/email/ses";
import { deriveProfileFromUser } from "@/lib/auth/profile";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");

  // Only staff authenticate; send them to their intended admin page or the panel.
  const destination = rawNext && isSafeRedirectPath(rawNext) ? rawNext : "/admin";

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
        sendWelcomeEmail({ to: data.user.email, name }).catch((err) =>
          console.error("[Auth Callback] Welcome email failed:", err),
        );
      }
    }
  }

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}

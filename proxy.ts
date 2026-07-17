import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowlistedAdminEmail } from "@/lib/security/admin-allowlist";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const path = request.nextUrl.pathname;

  // When Supabase redirects OAuth back to the Site URL (root) with a ?code=,
  // we forward it to the real callback handler. This happens when the browser
  // lands on / instead of /auth/callback after Google sign-in.
  if (path === "/" && request.nextUrl.searchParams.has("code")) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  // Strict SEO canonical lowercasing for programmatic routes
  if (
    (path.startsWith("/locations/") || path.startsWith("/categories/")) &&
    path !== path.toLowerCase()
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = path.toLowerCase();
    return NextResponse.redirect(redirectUrl, 301);
  }

  const isAdminRoute =
    path.startsWith("/admin") && !path.startsWith("/admin-login");

  // Only the staff admin panel requires auth. The public site has no buyer login.
  const isProtectedRoute = isAdminRoute;

  // OPTIMIZATION: Skip expensive auth checks on public pages
  // This drastically improves TTFB for static marketing and SEO pages
  if (!isProtectedRoute) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/sign-in";
    redirectUrl.searchParams.set(
      "redirectedFrom",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminRoute && user) {
    let isAuthorizedAdmin = isAllowlistedAdminEmail(user.email);

    if (!isAuthorizedAdmin) {
      const platformRole = user.app_metadata?.platform_role;
      if (platformRole === "owner" || platformRole === "admin" || platformRole === "moderator") {
        isAuthorizedAdmin = true;
      } else {
        const { data: roleRecord } = await supabase
          .from("admin_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("active", true)
          .maybeSingle();
          
        if (roleRecord) {
          isAuthorizedAdmin = true;
        }
      }
    }

    if (!isAuthorizedAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/"; // Redirect unauthorized users away from admin
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

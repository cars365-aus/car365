import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowlistedAdminEmail } from "@/lib/security/admin-allowlist";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
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
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const path = request.nextUrl.pathname;

  // Strict SEO canonical lowercasing for programmatic routes
  if (
    (path.startsWith("/locations/") || path.startsWith("/categories/")) &&
    path !== path.toLowerCase()
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = path.toLowerCase();
    return NextResponse.redirect(redirectUrl, 301); // 301 Permanent Redirect for SEO
  }

  const isAdminRoute =
    path.startsWith("/admin") && !path.startsWith("/admin-login");
  const isAccountRoute = path.startsWith("/account");

  // Admin panel is for staff, /account is for public buyers. Both require auth.
  const isProtectedRoute = isAdminRoute || isAccountRoute;

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

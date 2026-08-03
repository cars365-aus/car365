import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowlistedAdminEmail } from "@/lib/security/admin-allowlist";

// ─── Bot / Scraper UA Lists ────────────────────────────────────────────────────
//
// Strategy: allow legitimate SEO crawlers (Googlebot etc.) unconditionally.
// Block known bad actors that ignore robots.txt, harvest data, run AI training
// scrapes, or are commonly used in DDoS/spam toolchains.
//
// This list is intentionally conservative — we only block UAs with documented
// malicious/abusive behaviour. Good-faith unknown bots fall through to the
// rate-limit layer rather than being hard-blocked here.
// ─────────────────────────────────────────────────────────────────────────────

/** Good-faith SEO / social bots we NEVER block (SEO must not be impacted). */
const ALLOWED_BOTS = [
  "googlebot",
  "bingbot",
  "slurp",          // Yahoo
  "duckduckbot",
  "baiduspider",
  "sogou",
  "exabot",
  "facebot",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "whatsapp",
  "applebot",
  "yeti",           // Naver (Korean search)
  "pinterestbot",
  "tumblr",
  "telegrambot",
];

/**
 * Known bad-actor UAs: AI training scrapers, SEO attack tools, and crawlers
 * commonly used in DDoS amplification or data theft campaigns.
 *
 * Sources: Cloudflare threat intelligence, Fastly security blog, community
 * reports. Last reviewed: 2026-08.
 */
const BAD_BOT_PATTERNS = [
  // AI training scrapers (no permission, ignore robots.txt)
  "gptbot",
  "ccbot",
  "anthropic-ai",
  "claudebot",
  "claude-web",
  "cohere-ai",
  "google-extended",   // Gemini training (distinct from Googlebot)
  "meta-externalagent",// Meta AI training
  "bytespider",        // TikTok/ByteDance scraper — known DDoS involvement
  "petalbot",          // Huawei — mass crawler
  "omgilibot",
  "omgili",

  // Aggressive SEO / OSINT tools
  "ahrefsbot",
  "semrushbot",
  "dotbot",
  "mj12bot",           // Majestic
  "blexbot",
  "dataforseobot",
  "sistrix",
  "seokicks",
  "serpstatbot",
  "rogerbot",          // Moz — replaced by legitimate moz-search
  "opensiteexplorer",
  "spbot",
  "linkdexbot",
  "seobilitybot",
  "siteimprovebot",
  "babbar",
  "aboundex",

  // Scrapers / rippers known for ToS violations
  "scrapy",
  "python-httpx",
  "go-http-client",    // Common headless scraper runtime
  "axios",             // Frequently used in mass-scrape bots
  "curl/",             // Raw curl is almost always automated; allows curl/7.x
  "wget",
  "libwww-perl",
  "lwp-trivial",
  "jakarta commons",
  "htmlparser",
  "htmlunit",
  "mechanize",
  "pycurl",
  "twisted ",
  "winhttp",
  "java/",             // Generic Java HTTP client
  "ruby/",             // Generic Ruby HTTP client (not Twitterbot etc.)

  // DDoS / attack tools
  "masscan",
  "nmap",
  "sqlmap",
  "nikto",
  "dirbuster",
  "zgrab",
  "zmap",
  "nuclei",
  "acunetix",
  "burpsuite",
  "nessus",
  "openvas",
];

/**
 * Returns true if the User-Agent belongs to a known bad-actor bot that we
 * should block. Legitimate SEO bots are explicitly allowed first.
 */
function isBadBot(ua: string): boolean {
  if (!ua || ua.length === 0) return false;
  const lower = ua.toLowerCase();

  // Never block good-faith crawlers
  for (const allowed of ALLOWED_BOTS) {
    if (lower.includes(allowed)) return false;
  }

  for (const pattern of BAD_BOT_PATTERNS) {
    if (lower.includes(pattern)) return true;
  }

  return false;
}

/** Missing or suspiciously short User-Agent (common in DDoS toolchains). */
function isSuspiciousUA(ua: string | null): boolean {
  if (!ua) return true;              // No UA at all
  if (ua.length < 10) return true;   // Impossibly short — not a real browser
  return false;
}

export async function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  const path = request.nextUrl.pathname;

  // ── 1. Hard-block known bad bots ────────────────────────────────────────────
  // Return 403 with no body to minimise response cost and avoid tipping off
  // automated scanners that inspect response bodies for clues.
  if (isBadBot(ua)) {
    return new NextResponse(null, { status: 403 });
  }

  // ── 2. Block requests with missing/suspicious UA on mutation endpoints ───────
  // Public GET pages are exempt so we don't break pre-rendering or curl checks.
  const isMutation =
    request.method === "POST" ||
    request.method === "PUT" ||
    request.method === "PATCH" ||
    request.method === "DELETE";

  if (isMutation && path.startsWith("/api/") && isSuspiciousUA(ua)) {
    return new NextResponse(null, { status: 403 });
  }

  // ── 3. Inject X-Robots-Tag: noindex on non-public paths ─────────────────────
  // Even if a crawler gets past robots.txt, these headers are respected by all
  // major search engines and prevent accidental indexing of admin/API paths.
  const isNonPublicPath =
    path.startsWith("/api/") ||
    path.startsWith("/admin") ||
    path.startsWith("/auth/");

  let response = NextResponse.next({ request });

  if (isNonPublicPath) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  // Remove fingerprinting headers injected by Node/Next at the edge layer.
  // (next.config.ts handles the server-rendered path; this covers edge.)
  response.headers.delete("x-powered-by");
  response.headers.delete("server");

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
        // Re-apply security headers after response is recreated
        if (isNonPublicPath) {
          response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
        }
        response.headers.delete("x-powered-by");
        response.headers.delete("server");
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // ── 4. OAuth code redirect ───────────────────────────────────────────────────
  if (path === "/" && request.nextUrl.searchParams.has("code")) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  // ── 5. Strict SEO canonical lowercasing for programmatic routes ──────────────
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
  const isProtectedRoute = isAdminRoute;

  // OPTIMIZATION: Skip expensive auth checks on public pages.
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
      if (
        platformRole === "owner" ||
        platformRole === "admin" ||
        platformRole === "moderator"
      ) {
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
      redirectUrl.pathname = "/";
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

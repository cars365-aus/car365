import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type RedirectRule = { toPath: string; code: 301 | 302 | 307 | 308 | 410 };

/**
 * Resolve a stored redirect for a request path (SRS §13.2/§16.2). Sold VDPs are
 * archived 60 days after sale by `expire_stale_vdps()`, which inserts a 301 to
 * the model landing page. Read via the service-role client — the `redirects`
 * table is staff-RLS with no public policy.
 */
export const resolveRedirect = unstable_cache(
  async (fromPath: string): Promise<RedirectRule | null> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("redirects")
      .select("to_path, code")
      .eq("from_path", fromPath)
      .maybeSingle();
    if (!data) return null;
    return { toPath: data.to_path as string, code: (data.code as RedirectRule["code"]) ?? 301 };
  },
  ["redirect-rule"],
  { revalidate: 3600, tags: ["redirects"] },
);

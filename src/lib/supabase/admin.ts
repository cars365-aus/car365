import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/config";

export function createAdminClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL").trim(),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY").trim(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

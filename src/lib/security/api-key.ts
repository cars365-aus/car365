import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = `hcm_${randomBytes(24).toString("hex")}`;
  return {
    key: raw,
    prefix: raw.slice(0, 12),
    hash: hashApiKey(raw),
  };
}

export async function authenticateApiKey(
  authorization: string | null,
): Promise<{ organizationId: string; keyId: string } | null> {
  if (!authorization?.startsWith("Bearer ")) return null;
  const key = authorization.slice(7).trim();
  if (!key.startsWith("hcm_")) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id, organization_id")
    .eq("key_hash", hashApiKey(key))
    .eq("revoked", false)
    .maybeSingle();

  if (!data) return null;

  void supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { organizationId: data.organization_id, keyId: data.id };
}

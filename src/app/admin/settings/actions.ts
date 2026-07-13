"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const revalidate = revalidateTag as (tag: string) => void;

async function upsertSetting(key: string, value: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("settings").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) return { error: error.message };
  revalidate("settings");
  revalidate("public");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function saveCompanyProfile(_prev: unknown, formData: FormData) {
  await requireAdmin();
  return upsertSetting("company_profile", {
    legal_name: String(formData.get("legalName") ?? ""),
    trading_name: String(formData.get("tradingName") ?? ""),
    abn: String(formData.get("abn") ?? ""),
    email: String(formData.get("email") ?? ""),
    google_rating: Number(formData.get("googleRating") ?? 0) || null,
    google_review_count: Number(formData.get("googleReviewCount") ?? 0) || null,
  });
}

export async function savePhoneNumbers(_prev: unknown, formData: FormData) {
  await requireAdmin();
  return upsertSetting("phone_numbers", {
    primary: String(formData.get("primary") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
  });
}

export async function saveFinanceParams(_prev: unknown, formData: FormData) {
  await requireAdmin();
  return upsertSetting("finance_params", {
    annual_rate: Number(formData.get("annualRate") ?? 0),
    term_months: Number(formData.get("termMonths") ?? 60),
    deposit_pct: Number(formData.get("depositPct") ?? 10),
    disclaimer: String(formData.get("disclaimer") ?? ""),
  });
}

export async function saveNotificationRecipients(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const emails = String(formData.get("emails") ?? "")
    .split(/[\n,]/).map((e) => e.trim()).filter(Boolean);
  return upsertSetting("notification_recipients", { emails });
}

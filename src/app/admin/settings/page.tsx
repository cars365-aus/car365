import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveLocations } from "@/lib/data/locations";
import { SettingsForms } from "./settings-forms";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

type V = Record<string, unknown>;

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();
  const [{ data }, locations] = await Promise.all([
    supabase.from("settings").select("key, value"),
    getActiveLocations()
  ]);
  const byKey = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, V>;

  const recipients = ((byKey.notification_recipients?.emails as string[]) ?? []).filter(Boolean);
  const locationHours = locations[0]?.hours ?? {};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">These values drive the public site — phone/WhatsApp CTAs, finance estimates, and lead alerts.</p>
      </header>
      <SettingsForms
        company={byKey.company_profile ?? {}}
        phones={byKey.phone_numbers ?? {}}
        finance={byKey.finance_params ?? {}}
        recipients={recipients}
        locationHours={locationHours}
      />
    </div>
  );
}

import Link from "next/link";
import { requireAdmin } from "@/lib/security/auth";
import { Settings, Shield, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { optionalEnv } from "@/lib/config";

export const metadata = {
  title: "Platform Settings",
};

function maskSecret(value: string | undefined, visible = 4) {
  if (!value) return "Not configured";
  if (value.length <= visible) return "••••";
  return `${value.slice(0, visible)}${"•".repeat(12)}`;
}

export default async function AdminSettingsPage() {
  await requireAdmin();

  const stripeKey = optionalEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  const mapsKey = optionalEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Platform Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Read-only overview of platform security and integrations. Changes are made via environment variables and Supabase dashboard.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Security & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="font-medium text-foreground">Admin MFA enforced</p>
              <p className="text-muted-foreground mt-1">
                All admin routes require Supabase authenticator MFA (AAL2). Enroll at{" "}
                <Link href="/auth/mfa" className="text-primary hover:underline">
                  /auth/mfa
                </Link>
                .
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium text-foreground">Vendor approval</p>
              <p className="text-muted-foreground mt-1">
                Manual review is required for new vendors and listings. Use the{" "}
                <Link href="/admin/vendors" className="text-primary hover:underline">
                  vendor queue
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Integration Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Stripe publishable key</label>
              <input
                type="text"
                value={maskSecret(stripeKey)}
                disabled
                className="mt-1 block w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground sm:text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Google Maps API key</label>
              <input
                type="text"
                value={maskSecret(mapsKey)}
                disabled
                className="mt-1 block w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground sm:text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Update keys in Vercel environment variables. Never store secrets in the database.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

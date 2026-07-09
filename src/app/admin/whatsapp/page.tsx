import { requireAdmin } from "@/lib/security/auth";
import { getAutoResponderConfig } from "@/lib/whatsapp/config";
import { optionalEnv } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Wifi } from "lucide-react";
import { WhatsAppConfigForm } from "./whatsapp-config-form";

export const metadata = {
  title: "WhatsApp Auto-Responder",
};

export default async function AdminWhatsAppPage() {
  await requireAdmin();

  const config = await getAutoResponderConfig();
  const phoneNumberId = optionalEnv("WHATSAPP_PHONE_NUMBER_ID");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          WhatsApp Auto-Responder
        </h1>
        <p className="mt-2 text-muted-foreground">
          Configure automatic acknowledgement replies, business hours, and lead
          routing for inbound WhatsApp messages.
        </p>
      </section>

      {/* Connection Status (read-only) */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Phone Number ID
            </label>
            <input
              type="text"
              value={phoneNumberId ?? "Not configured"}
              disabled
              className="mt-1 block w-full max-w-md rounded-lg border border-border bg-muted px-3 py-2 text-foreground sm:text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The webhook subscription is managed via the Meta App Dashboard. Ensure
            the webhook URL points to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /api/whatsapp/webhook
            </code>{" "}
            and the verify token matches your environment variable.
          </p>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <WhatsAppConfigForm config={config} />
    </div>
  );
}

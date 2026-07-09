import { AlertTriangle, MailCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/security/auth";
import { MarketingForm } from "./marketing-form";

export const metadata = {
  title: "Marketing",
};

export default async function AdminMarketingPage() {
  await requireAdmin();

  const fromEmail = process.env.EMAIL_FROM ?? "Hire Car Marketplace <noreply@hirecarmarketplace.com.au>";
  const replyToEmail = process.env.REPLY_TO_EMAIL ?? process.env.CONTACT_EMAIL_TO ?? "support@hirecarmarketplace.com.au";
  const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="flex flex-col gap-3 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Marketing Broadcasts
          </h1>
          <Badge variant={isSmtpConfigured ? "success" : "warning"}>
            {isSmtpConfigured ? "SMTP configured" : "SMTP not configured"}
          </Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Compose campaign emails for test sends, manual recipient lists, all account emails, or vendor billing contacts.
        </p>
      </section>

      <Card variant="default" className={isSmtpConfigured ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}>
        <CardContent className="flex items-start gap-3 p-4">
          {isSmtpConfigured ? (
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          )}
          <div className="text-sm">
            <p className={isSmtpConfigured ? "font-semibold text-emerald-900" : "font-semibold text-amber-900"}>
              Sending from: {fromEmail}
            </p>
            <p className={isSmtpConfigured ? "mt-1 text-emerald-800" : "mt-1 text-amber-800"}>
              {isSmtpConfigured
                ? `Replies route to ${replyToEmail}.`
                : "SMTP is not configured. Add SMTP_HOST, SMTP_USER and SMTP_PASS to your Vercel environment variables to enable email sending."}
            </p>
          </div>
        </CardContent>
      </Card>

      <MarketingForm />
    </div>
  );
}

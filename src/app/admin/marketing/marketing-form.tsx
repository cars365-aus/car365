"use client";

import { useActionState } from "react";
import { Megaphone, Send, CheckCircle, AlertCircle, Users, Mail } from "lucide-react";

import { sendMarketingCampaign } from "@/app/admin/marketing/actions";
import type { MarketingEmailState } from "@/app/admin/marketing/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: MarketingEmailState = {
  status: "idle",
  message: "",
};

export function MarketingForm() {
  const [state, action, isPending] = useActionState(sendMarketingCampaign, initialState);

  return (
    <Card variant="elevated">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Compose campaign
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {state.status !== "idle" && (
          <div
            className={`mb-6 rounded-xl border px-5 py-4 text-sm ${
              state.status === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
            role="status"
          >
            <div className="flex items-start gap-3">
              {state.status === "success" ? (
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${state.status === "success" ? "text-emerald-800" : "text-red-800"}`}>
                  {state.status === "success" ? "Campaign sent!" : "Campaign failed"}
                </p>
                <p className={`mt-0.5 ${state.status === "success" ? "text-emerald-700" : "text-red-700"}`}>
                  {state.message}
                </p>
                {state.details && (
                  <div className="mt-3 flex gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/70 border border-current/20 rounded-full px-3 py-1 text-emerald-700">
                      <Mail className="h-3.5 w-3.5" />
                      {state.details.sent} sent
                    </span>
                    {state.details.failed > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/70 border border-red-200 rounded-full px-3 py-1 text-red-700">
                        {state.details.failed} failed
                      </span>
                    )}
                    {state.details.skipped > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/70 border border-amber-200 rounded-full px-3 py-1 text-amber-700">
                        {state.details.skipped} skipped
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/70 border border-slate-200 rounded-full px-3 py-1 text-slate-600">
                      <Users className="h-3.5 w-3.5" />
                      {state.details.recipientCount} total
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form action={action} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="audience">Audience</Label>
            <select
              id="audience"
              name="audience"
              defaultValue="admin"
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="admin">🧪 Admin test inbox only</option>
              <option value="manual">✍️ Manual recipients (enter below)</option>
              <option value="accounts">👥 All registered accounts</option>
              <option value="vendors">🏢 Vendor billing contacts</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recipients">Manual recipients <span className="text-muted-foreground font-normal">(one per line, or comma-separated)</span></Label>
            <Textarea
              id="recipients"
              name="recipients"
              rows={3}
              placeholder="one@example.com, two@example.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="subject">Email subject line <span className="text-red-500">*</span></Label>
              <Input id="subject" name="subject" maxLength={160} required placeholder="e.g. New vehicles available in your area" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="heading">Hero heading <span className="text-red-500">*</span></Label>
              <Input id="heading" name="heading" maxLength={120} required placeholder="e.g. Explore our latest fleet" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">Email body <span className="text-red-500">*</span></Label>
            <Textarea
              id="body"
              name="body"
              rows={10}
              placeholder="Write the campaign copy here. Leave a blank line between paragraphs — they'll be formatted automatically."
              required
            />
            <p className="text-xs text-muted-foreground">Blank lines become new paragraphs. No HTML required.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ctaLabel">CTA button label <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="ctaLabel" name="ctaLabel" placeholder="Browse vehicles" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ctaUrl">CTA button URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="ctaUrl" name="ctaUrl" type="url" placeholder="https://www.hirecarmarketplace.com.au/search" />
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">⚠️ Before sending to All Accounts or Vendors:</p>
            <ul className="mt-1.5 list-disc list-inside space-y-1 text-amber-700">
              <li>Always test with <strong>Admin test inbox</strong> first</li>
              <li>Verify your SMTP sender domain is configured and emails land in inbox (not spam)</li>
              <li>This sends to all contacts — there is no undo</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="cta" disabled={isPending}>
              <Send className="h-4 w-4" />
              {isPending ? "Sending…" : "Send campaign"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

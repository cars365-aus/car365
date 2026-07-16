"use client";

import { useActionState } from "react";
import { saveCompanyProfile, savePhoneNumbers, saveFinanceParams, saveNotificationRecipients, saveLocationHours } from "./actions";

const input = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground";
type V = Record<string, unknown>;
type Action = (state: { ok?: boolean; error?: string } | undefined, fd: FormData) => Promise<{ ok?: boolean; error?: string }>;

function Card({ title, action, children }: { title: string; action: Action; children: React.ReactNode }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border bg-card p-5 flex flex-col h-full">
      <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
      <div className="flex-1 space-y-3">
        {children}
      </div>
      <div className="flex items-center gap-3 pt-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
        {state?.ok ? <span className="text-sm text-success">Saved.</span> : null}
        {state?.error ? <span className="text-sm text-danger">{state.error}</span> : null}
      </div>
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">{label}</span>{children}</label>;
}

export function SettingsForms({ company, phones, finance, recipients, locationHours }: { company: V; phones: V; finance: V; recipients: string[]; locationHours: Record<string, string> }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Company profile" action={saveCompanyProfile}>
        <div className="grid grid-cols-2 gap-3">
          <L label="Legal name"><input name="legalName" defaultValue={String(company.legal_name ?? "")} className={input} /></L>
          <L label="Trading name"><input name="tradingName" defaultValue={String(company.trading_name ?? "")} className={input} /></L>
          <L label="ABN"><input name="abn" defaultValue={String(company.abn ?? "")} className={input} /></L>
          <L label="Email"><input name="email" type="email" defaultValue={String(company.email ?? "")} className={input} /></L>
          <L label="Google rating"><input name="googleRating" type="number" step="0.1" defaultValue={String(company.google_rating ?? "")} className={input} /></L>
          <L label="Google review count"><input name="googleReviewCount" type="number" defaultValue={String(company.google_review_count ?? "")} className={input} /></L>
        </div>
      </Card>

      <Card title="Opening Hours" action={saveLocationHours}>
        <div className="grid grid-cols-2 gap-3">
          <L label="Monday"><input name="mon" defaultValue={locationHours.mon ?? ""} className={input} placeholder="9:00-18:00 or closed" /></L>
          <L label="Tuesday"><input name="tue" defaultValue={locationHours.tue ?? ""} className={input} placeholder="9:00-18:00 or closed" /></L>
          <L label="Wednesday"><input name="wed" defaultValue={locationHours.wed ?? ""} className={input} placeholder="9:00-18:00 or closed" /></L>
          <L label="Thursday"><input name="thu" defaultValue={locationHours.thu ?? ""} className={input} placeholder="9:00-18:00 or closed" /></L>
          <L label="Friday"><input name="fri" defaultValue={locationHours.fri ?? ""} className={input} placeholder="9:00-18:00 or closed" /></L>
          <L label="Saturday"><input name="sat" defaultValue={locationHours.sat ?? ""} className={input} placeholder="9:00-18:00 or closed" /></L>
          <L label="Sunday"><input name="sun" defaultValue={locationHours.sun ?? ""} className={input} placeholder="9:00-18:00 or closed" /></L>
        </div>
      </Card>

      <Card title="Phone & WhatsApp" action={savePhoneNumbers}>
        <L label="Primary phone (display)"><input name="primary" defaultValue={String(phones.primary ?? "")} className={input} placeholder="03 9123 4567" /></L>
        <L label="WhatsApp (E.164, no +)"><input name="whatsapp" defaultValue={String(phones.whatsapp ?? "")} className={input} placeholder="61391234567" /></L>
      </Card>

      <Card title="Finance estimate" action={saveFinanceParams}>
        <div className="grid grid-cols-3 gap-3">
          <L label="Annual rate %"><input name="annualRate" type="number" step="0.01" defaultValue={String(finance.annual_rate ?? 8.99)} className={input} /></L>
          <L label="Term (months)"><input name="termMonths" type="number" defaultValue={String(finance.term_months ?? 60)} className={input} /></L>
          <L label="Deposit %"><input name="depositPct" type="number" defaultValue={String(finance.deposit_pct ?? 10)} className={input} /></L>
        </div>
        <L label="Disclaimer"><textarea name="disclaimer" rows={3} defaultValue={String(finance.disclaimer ?? "")} className={input} /></L>
      </Card>

      <Card title="Lead notifications" action={saveNotificationRecipients}>
        <L label="Recipient emails (one per line)"><textarea name="emails" rows={4} defaultValue={recipients.join("\n")} className={input} placeholder="sales@cars-365.com.au" /></L>
        <p className="text-xs text-muted-foreground">New leads are emailed to these addresses.</p>
      </Card>
    </div>
  );
}

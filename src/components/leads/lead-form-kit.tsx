"use client";

import { useId } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Check, Loader2, Phone, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label}{required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, "min-h-24", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, props.className)} />;
}

/** Off-screen honeypot. Real users never fill it; bots often do. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" tabIndex={-1}>
      <label>
        Website
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

export function ConsentCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-border"
      />
      <label htmlFor={id} className="text-xs text-muted-foreground">{children}</label>
    </div>
  );
}

/** Renders the Turnstile widget only when configured (skipped in dev). */
export function TurnstileField({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return <Turnstile siteKey={siteKey} onSuccess={onToken} options={{ size: "flexible" }} />;
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
    >
      {loading ? <Loader2 className="size-5 animate-spin" /> : null}
      {children}
    </button>
  );
}

/** Inline thank-you state that replaces the form on success (SRS FR-12). */
export function LeadSuccess({
  heading = "Thanks — we've got your enquiry.",
  phone,
  whatsappUrl,
}: {
  heading?: string;
  phone?: string | null;
  whatsappUrl?: string | null;
}) {
  return (
    <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center">
      <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-success/15">
        <Check className="size-6 text-success" />
      </div>
      <h3 className="font-heading text-lg font-bold text-foreground">{heading}</h3>
      <p className="mt-1 text-sm text-body">A specialist will contact you shortly — within 15 minutes during business hours.</p>
      {(phone || whatsappUrl) ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {phone ? (
            <a href={`tel:${phone}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
              <Phone className="size-4" /> Call {phone}
            </a>
          ) : null}
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              <MessageCircle className="size-4" /> WhatsApp us
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const PRIVACY_MICROCOPY =
  "We only use your details to contact you about this enquiry.";

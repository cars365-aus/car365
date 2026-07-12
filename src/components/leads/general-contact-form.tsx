"use client";

import { useEffect, useRef, useState } from "react";
import {
  Field, TextInput, Select, TextArea, Honeypot, TurnstileField,
  SubmitButton, LeadSuccess, PRIVACY_MICROCOPY,
} from "@/components/leads/lead-form-kit";
import { submitLead } from "@/lib/leads/submit";

/** General contact enquiry (SRS FR-7). */
export function GeneralContactForm({ phone, whatsappUrl }: { phone?: string | null; whatsappUrl?: string | null }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", subject: "general", message: "" });
  const [website, setWebsite] = useState("");
  const [token, setToken] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const renderedAt = useRef(0);
  useEffect(() => { renderedAt.current = Date.now(); }, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await submitLead({
      type: "general", name: f.name, phone: f.phone, email: f.email || undefined,
      subject: f.subject, message: f.message,
      website, formRenderedAt: renderedAt.current, turnstileToken: token,
    });
    setLoading(false);
    if (res.ok) setDone(true); else setError(res.error);
  }

  if (done) return <LeadSuccess phone={phone} whatsappUrl={whatsappUrl} />;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Honeypot value={website} onChange={setWebsite} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name" required><TextInput value={f.name} onChange={set("name")} required autoComplete="name" /></Field>
        <Field label="Phone" required><TextInput value={f.phone} onChange={set("phone")} required type="tel" inputMode="tel" placeholder="04XX XXX XXX" /></Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Email"><TextInput value={f.email} onChange={set("email")} type="email" inputMode="email" /></Field>
        <Field label="Subject">
          <Select value={f.subject} onChange={set("subject")}>
            <option value="general">General</option><option value="buying">Buying</option>
            <option value="selling">Selling</option><option value="finance">Finance</option>
            <option value="feedback">Feedback</option>
          </Select>
        </Field>
      </div>
      <Field label="Message" required><TextArea value={f.message} onChange={set("message")} required /></Field>
      <TurnstileField onToken={setToken} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SubmitButton loading={loading}>Send message</SubmitButton>
      <p className="text-xs text-muted-foreground">{PRIVACY_MICROCOPY}</p>
    </form>
  );
}

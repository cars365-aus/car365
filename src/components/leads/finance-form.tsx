"use client";

import { useEffect, useRef, useState } from "react";
import {
  Field, TextInput, Select, Honeypot, ConsentCheckbox, TurnstileField,
  SubmitButton, LeadSuccess, PRIVACY_MICROCOPY,
} from "@/components/leads/lead-form-kit";
import { submitLead } from "@/lib/leads/submit";

/** Finance enquiry (SRS FR-13). Email + consent are required. */
export function FinanceForm({ vehicleId, phone, whatsappUrl }: { vehicleId?: string; phone?: string | null; whatsappUrl?: string | null }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", employmentStatus: "", depositAmount: "", weeklyBudget: "" });
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [token, setToken] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const renderedAt = useRef(0);
  useEffect(() => { renderedAt.current = Date.now(); }, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setError("Please agree to be contacted about finance."); return; }
    setLoading(true); setError(null);
    const res = await submitLead({
      type: "finance", vehicleId,
      name: f.name, phone: f.phone, email: f.email,
      employmentStatus: f.employmentStatus || undefined,
      depositAmount: f.depositAmount || undefined,
      weeklyBudget: f.weeklyBudget || undefined,
      consent: true, website, formRenderedAt: renderedAt.current, turnstileToken: token,
    });
    setLoading(false);
    if (res.ok) setDone(true); else setError(res.error);
  }

  if (done) return <LeadSuccess heading="Thanks — our finance partner will be in touch." phone={phone} whatsappUrl={whatsappUrl} />;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Honeypot value={website} onChange={setWebsite} />
      <Field label="Name" required><TextInput value={f.name} onChange={set("name")} required autoComplete="name" /></Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Phone" required><TextInput value={f.phone} onChange={set("phone")} required type="tel" inputMode="tel" placeholder="04XX XXX XXX" /></Field>
        <Field label="Email" required><TextInput value={f.email} onChange={set("email")} required type="email" inputMode="email" /></Field>
      </div>
      <Field label="Employment status">
        <Select value={f.employmentStatus} onChange={set("employmentStatus")}>
          <option value="">Select…</option>
          <option>Full-time</option><option>Part-time</option><option>Casual</option>
          <option>Self-employed</option><option>Contractor</option><option>Other</option>
        </Select>
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Deposit (approx)"><TextInput value={f.depositAmount} onChange={set("depositAmount")} inputMode="numeric" placeholder="$" /></Field>
        <Field label="Weekly budget"><TextInput value={f.weeklyBudget} onChange={set("weeklyBudget")} inputMode="numeric" placeholder="$/wk" /></Field>
      </div>
      <ConsentCheckbox checked={consent} onChange={setConsent}>
        I agree to be contacted about finance and for my details to be shared with a finance partner.
      </ConsentCheckbox>
      <TurnstileField onToken={setToken} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SubmitButton loading={loading}>Enquire about finance</SubmitButton>
      <p className="text-xs text-muted-foreground">{PRIVACY_MICROCOPY}</p>
    </form>
  );
}

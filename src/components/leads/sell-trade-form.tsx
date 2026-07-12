"use client";

import { useEffect, useRef, useState } from "react";
import {
  Field, TextInput, Select, TextArea, Honeypot, TurnstileField,
  SubmitButton, LeadSuccess, PRIVACY_MICROCOPY,
} from "@/components/leads/lead-form-kit";
import { submitLead } from "@/lib/leads/submit";

/**
 * Sell-your-car (SRS FR-15) and trade-in (FR-14) share a shape: current-car
 * details + contact. `mode` picks the lead type and field names.
 */
export function SellTradeForm({
  mode,
  vehicleId,
  phone,
  whatsappUrl,
}: {
  mode: "sell" | "trade_in";
  vehicleId?: string;
  phone?: string | null;
  whatsappUrl?: string | null;
}) {
  const [f, setF] = useState({ make: "", model: "", year: "", km: "", condition: "good", registration: "", expectedPrice: "", name: "", phone: "", notes: "" });
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
    const carFields = mode === "sell"
      ? { make: f.make, model: f.model, year: f.year, mileageKm: f.km, condition: f.condition }
      : { tradeMake: f.make, tradeModel: f.model, tradeYear: f.year, tradeMileageKm: f.km, tradeCondition: f.condition };
    const res = await submitLead({
      type: mode, vehicleId,
      name: f.name, phone: f.phone, message: f.notes || undefined,
      ...carFields,
      registration: f.registration || undefined,
      expectedPrice: f.expectedPrice || undefined,
      website, formRenderedAt: renderedAt.current, turnstileToken: token,
    });
    setLoading(false);
    if (res.ok) setDone(true); else setError(res.error);
  }

  if (done) {
    return (
      <LeadSuccess
        heading={mode === "sell" ? "Thanks — we'll be in touch with an offer." : "Thanks — we'll value your trade-in."}
        phone={phone}
        whatsappUrl={whatsappUrl}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Honeypot value={website} onChange={setWebsite} />
      <p className="text-sm font-semibold text-foreground">Your car</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Make" required><TextInput value={f.make} onChange={set("make")} required placeholder="e.g. Toyota" /></Field>
        <Field label="Model" required><TextInput value={f.model} onChange={set("model")} required placeholder="e.g. Corolla" /></Field>
        <Field label="Year" required><TextInput value={f.year} onChange={set("year")} required inputMode="numeric" placeholder="e.g. 2018" /></Field>
        <Field label="Kilometres" required><TextInput value={f.km} onChange={set("km")} required inputMode="numeric" placeholder="e.g. 65000" /></Field>
        <Field label="Condition">
          <Select value={f.condition} onChange={set("condition")}>
            <option value="excellent">Excellent</option><option value="good">Good</option>
            <option value="fair">Fair</option><option value="poor">Poor</option>
          </Select>
        </Field>
        <Field label="Rego (optional)"><TextInput value={f.registration} onChange={set("registration")} /></Field>
      </div>
      <Field label="Expected price (optional)"><TextInput value={f.expectedPrice} onChange={set("expectedPrice")} inputMode="numeric" placeholder="$" /></Field>

      <p className="pt-2 text-sm font-semibold text-foreground">Your details</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name" required><TextInput value={f.name} onChange={set("name")} required autoComplete="name" /></Field>
        <Field label="Phone" required><TextInput value={f.phone} onChange={set("phone")} required type="tel" inputMode="tel" placeholder="04XX XXX XXX" /></Field>
      </div>
      <Field label="Anything else?"><TextArea value={f.notes} onChange={set("notes")} /></Field>
      <TurnstileField onToken={setToken} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SubmitButton loading={loading}>{mode === "sell" ? "Get my offer" : "Value my trade-in"}</SubmitButton>
      <p className="text-xs text-muted-foreground">{PRIVACY_MICROCOPY}</p>
    </form>
  );
}

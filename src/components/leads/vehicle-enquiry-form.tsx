"use client";

import { useEffect, useRef, useState } from "react";
import {
  Field, TextInput, TextArea, Honeypot, TurnstileField,
  SubmitButton, LeadSuccess, PRIVACY_MICROCOPY,
} from "@/components/leads/lead-form-kit";
import { submitLead } from "@/lib/leads/submit";

/** VDP quick enquiry (SRS FR-8): name, phone, message pre-filled with the car. */
export function VehicleEnquiryForm({
  vehicleId,
  vehicleTitle,
  phone,
  whatsappUrl,
}: {
  vehicleId: string;
  vehicleTitle: string;
  phone?: string | null;
  whatsappUrl?: string | null;
}) {
  const [name, setName] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [message, setMessage] = useState(`I'm interested in the ${vehicleTitle}.`);
  const [website, setWebsite] = useState("");
  const [token, setToken] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const renderedAt = useRef(0);
  useEffect(() => { renderedAt.current = Date.now(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await submitLead({
      type: "vehicle_enquiry",
      vehicleId,
      name,
      phone: phoneVal,
      message,
      website,
      formRenderedAt: renderedAt.current,
      turnstileToken: token,
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else setError(res.error);
  }

  if (done) return <LeadSuccess phone={phone} whatsappUrl={whatsappUrl} />;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Honeypot value={website} onChange={setWebsite} />
      <Field label="Name" required>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Your name" />
      </Field>
      <Field label="Phone" required>
        <TextInput value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} required type="tel" inputMode="tel" autoComplete="tel" placeholder="04XX XXX XXX" />
      </Field>
      <Field label="Message">
        <TextArea value={message} onChange={(e) => setMessage(e.target.value)} />
      </Field>
      <TurnstileField onToken={setToken} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SubmitButton loading={loading}>Send enquiry</SubmitButton>
      <p className="text-xs text-muted-foreground">{PRIVACY_MICROCOPY}</p>
    </form>
  );
}

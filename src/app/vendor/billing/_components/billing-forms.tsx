"use client";

import { useState } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";

export function PortalForm({ 
  organizationId,
  stripeCustomerId, 
  className,
  buttonText = "Manage Billing Portal",
  buttonClassName = "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
}: { 
  organizationId: string;
  stripeCustomerId: string; 
  className?: string;
  buttonText?: string;
  buttonClassName?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      } else if (data.error) {
        alert("Error: " + data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="stripeCustomerId" value={stripeCustomerId} />
      <button
        type="submit"
        disabled={loading}
        className={`${buttonClassName} disabled:opacity-50`}
      >
        <ExternalLink className="h-4 w-4" />
        {loading ? "Loading..." : buttonText}
      </button>
    </form>
  );
}

export function CheckoutForm({ 
  plan, 
  interval, 
  organizationId, 
  isPopular, 
  buttonText 
}: { 
  plan: string; 
  interval: string; 
  organizationId: string; 
  isPopular: boolean;
  buttonText: string;
}) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      } else if (data.error) {
        alert("Error: " + data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="interval" value={interval} />
      <input type="hidden" name="organizationId" value={organizationId} />

      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
          isPopular
            ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
            : "bg-slate-950 text-white hover:bg-slate-800"
        }`}
      >
        {loading ? "Loading..." : buttonText}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

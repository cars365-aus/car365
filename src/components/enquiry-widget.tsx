"use client";

import { useRef, useState } from "react";
import { Send, MessageCircle, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Turnstile, SCRIPT_URL, DEFAULT_ONLOAD_NAME } from "@marsidev/react-turnstile";
import { scrollIntoViewAndFocus } from "@/lib/form-utils";

interface EnquiryWidgetProps {
  vehicleId: string;
  vendorId: string;
  isLoggedIn: boolean;
  userProfile?: {
    name: string;
    email: string;
    phone: string;
  } | null;
  instantBook?: boolean;
}

export function EnquiryWidget({ vehicleId, vendorId, isLoggedIn, userProfile, instantBook }: EnquiryWidgetProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [licenseConfirmed, setLicenseConfirmed] = useState(false);

  const endDateRef = useRef<HTMLInputElement>(null);

  function handleEnquirySuccess(id: string) {
    setLeadId(id);
    setSuccess(true);
    if (isLoggedIn) {
      router.push(`/messages/${id}`);
    }
  }

  const handleQuickSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, vendorId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit interest");
      }

      if (data.leadId) {
        handleEnquirySuccess(data.leadId);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      setError("Please complete the security challenge. (If you don't see it, your adblocker or browser shields might be blocking it)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    if (startDate && endDate && endDate < startDate) {
      setError("Return date must be on or after the pickup date.");
      setIsSubmitting(false);
      // Guide the user to the invalid field on mobile (Req 4.5).
      scrollIntoViewAndFocus(endDateRef.current);
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          vendorId,
          name,
          email,
          phone,
          pickupCity,
          startDate,
          endDate,
          message,
          consent: true,
          turnstileToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit enquiry");
      }

      const id = data.leadId ?? data.id;
      if (id) {
        setLeadId(id);
        setSuccess(true);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setTurnstileToken("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    const chatPath = leadId ? `/messages/${leadId}` : "/customer/enquiries";
    const signInHref = `/auth/sign-in?redirectedFrom=${encodeURIComponent(chatPath)}`;

    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-4">
          <MessageCircle className="h-7 w-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-800">Enquiry Sent!</h3>
        <p className="mt-2 text-sm text-emerald-600">
          The vendor has been notified. {isLoggedIn ? "Opening your chat..." : "Sign in to chat with the vendor."}
        </p>
        {isLoggedIn && leadId ? (
          <button
            onClick={() => router.push(chatPath)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Open Chat
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            href={signInHref}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Sign in with Google to Chat
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {!isLoggedIn && (
          <p className="mt-3 text-xs text-emerald-700">
            Use the same email ({email}) when signing in to access this conversation.
          </p>
        )}
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {instantBook ? (
            <><Zap className="h-5 w-5 text-amber-500 fill-amber-500" /> Instant Book</>
          ) : (
            "Request to Book"
          )}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Click below to express your interest. We&apos;ll share your contact details (
          <span className="font-semibold text-foreground">{userProfile?.email}</span>) with the vendor and open a chat.
        </p>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        <label className="mt-6 flex items-start gap-3 text-sm text-slate-600 bg-muted p-4 rounded-xl border border-border cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
            checked={licenseConfirmed}
            onChange={(e) => setLicenseConfirmed(e.target.checked)}
            required
          />
          <span className="leading-snug">
            I confirm I hold a valid, unrestricted driver&apos;s license and understand the vendor will require it upon pickup.
          </span>
        </label>

        <button
          onClick={handleQuickSubmit}
          disabled={isSubmitting || !licenseConfirmed}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c2410c] to-[#ea580c] px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            <>
              {instantBook ? <Zap className="h-5 w-5 fill-white" /> : <Send className="h-5 w-5" />}
              {instantBook ? "Instant Book" : "Request to Book"}
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        {instantBook ? (
          <><Zap className="h-5 w-5 text-amber-500 fill-amber-500" /> Instant Book</>
        ) : (
          "Request to Book"
        )}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Or{" "}
        <Link href="/auth/sign-in" className="font-medium text-amber-600 hover:underline">
          log in
        </Link>{" "}
        for 1-click enquiries with instant chat.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <form className="mt-6 grid gap-4.5" onSubmit={handleGuestSubmit}>
        <input
          className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-base md:text-sm font-medium focus:bg-card focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all placeholder:text-slate-400"
          placeholder="Full name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-base md:text-sm font-medium focus:bg-card focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all placeholder:text-slate-400"
          placeholder="Email"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-base md:text-sm font-medium focus:bg-card focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all placeholder:text-slate-400"
          placeholder="Phone number"
          type="tel"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-base md:text-sm font-medium focus:bg-card focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all placeholder:text-slate-400"
          placeholder="Pickup city"
          name="pickupCity"
          autoComplete="address-level2"
          value={pickupCity}
          onChange={(e) => setPickupCity(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Pickup date</label>
            <input
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-base md:text-sm font-medium focus:bg-card focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all text-muted-foreground"
              type="date"
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Return date</label>
            <input
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-base md:text-sm font-medium focus:bg-card focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all text-muted-foreground"
              type="date"
              ref={endDateRef}
              value={endDate}
              min={startDate || new Date().toISOString().split("T")[0]}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        <textarea
          className="w-full min-h-[100px] rounded-xl border border-border bg-muted/50 px-4 py-3 text-base md:text-sm font-medium focus:bg-card focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all resize-none placeholder:text-slate-400"
          placeholder="Optional message to the vendor..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <label className="flex items-start gap-3 text-sm text-slate-600 mt-2 bg-muted p-4 rounded-xl border border-border cursor-pointer">
          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500" required />
          <span className="leading-snug">I agree for Hire Car to share my enquiry details with this verified local vendor.</span>
        </label>

        <label className="flex items-start gap-3 text-sm text-slate-600 bg-muted p-4 rounded-xl border border-border cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
            checked={licenseConfirmed}
            onChange={(e) => setLicenseConfirmed(e.target.checked)}
            required
          />
          <span className="leading-snug">
            I confirm I hold a valid, unrestricted driver&apos;s license and understand the vendor will require it upon pickup.
          </span>
        </label>

        <div className="flex justify-center">
          {/*
            Defer the Cloudflare Turnstile script until browser idle time (after
            FCP) instead of letting the widget inject it eagerly. injectScript is
            disabled and the script is loaded via next/script "lazyOnload"; the
            onload callback name matches what the widget registers on window, so
            it renders once the deferred script finishes loading (Requirement 6.5).
          */}
          <Script
            src={`${SCRIPT_URL}?onload=${DEFAULT_ONLOAD_NAME}&render=explicit`}
            strategy="lazyOnload"
          />
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
            injectScript={false}
            onSuccess={(token) => setTurnstileToken(token)}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !licenseConfirmed}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c2410c] to-[#ea580c] px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            <>
              {instantBook ? <Zap className="h-5 w-5 fill-white" /> : <Send className="h-5 w-5" />}
              {instantBook ? "Instant Book" : "Request to Book"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

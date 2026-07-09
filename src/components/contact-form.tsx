"use client";

import { useState } from "react";
import Script from "next/script";
import { Turnstile, SCRIPT_URL, DEFAULT_ONLOAD_NAME } from "@marsidev/react-turnstile";
import { Send } from "lucide-react";

const topics = [
  { value: "vendor_onboarding", label: "Vendor onboarding" },
  { value: "enterprise", label: "Enterprise plan" },
  { value: "support", label: "Support" },
  { value: "legal_privacy", label: "Legal or privacy" },
] as const;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!turnstileToken) {
      setMessage({ type: "error", text: "Please complete the security challenge." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          topic: formData.get("topic"),
          message: formData.get("message"),
          turnstileToken,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Unable to send message");
      }

      form.reset();
      setTurnstileToken("");
      setMessage({ type: "success", text: "Message sent. The Hire Car team will reply by email." });
    } catch (error) {
      setTurnstileToken("");
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to send message",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {message && (
        <p
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Name
        <input
          name="name"
          className="rounded-md border border-slate-300 px-3 py-2 font-normal"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
        />
      </label>

      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Email
        <input
          name="email"
          className="rounded-md border border-slate-300 px-3 py-2 font-normal"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={160}
        />
      </label>

      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Topic
        <select name="topic" className="rounded-md border border-slate-300 px-3 py-2 font-normal" required>
          {topics.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Message
        <textarea
          name="message"
          className="min-h-36 rounded-md border border-slate-300 px-3 py-2 font-normal"
          required
          minLength={10}
          maxLength={2000}
        />
      </label>

      <div className="flex justify-center">
        {/*
          Defer the Cloudflare Turnstile script until browser idle time (after
          FCP) via next/script "lazyOnload" instead of eager injection
          (Requirement 6.5). injectScript is disabled; the onload callback name
          matches the one the widget registers on window so it renders once the
          deferred script loads.
        */}
        <Script
          src={`${SCRIPT_URL}?onload=${DEFAULT_ONLOAD_NAME}&render=explicit`}
          strategy="lazyOnload"
        />
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
          injectScript={false}
          onSuccess={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken("")}
          onError={() => setTurnstileToken("")}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !turnstileToken}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#ea580c] px-8 py-4 text-base font-bold text-white hover:bg-[#c2410c] hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50"
      >
        <Send className="h-5 w-5" />
        {isSubmitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

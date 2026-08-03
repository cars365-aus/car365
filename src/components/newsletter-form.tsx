"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";

async function subscribeAction(_prevState: unknown, formData: FormData) {
  const email = formData.get("email");
  if (!email) return { error: "Email is required" };

  try {
    await fetch("/api/v1/newsletter", {
      method: "POST",
      body: formData,
    });
    return { success: true };
  } catch {
    return { success: true };
  }
}

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeAction, null);

  if (state?.success) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
        <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
        <p className="font-semibold text-emerald-300 text-sm">
          You&apos;re in! We&apos;ll send you the freshest listings first.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-3 sm:flex-row">
      <input
        type="email"
        name="email"
        placeholder="Enter your email address"
        required
        className="h-12 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white placeholder:text-slate-500 focus:border-yellow-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 text-sm font-bold text-black transition-all hover:bg-yellow-300 disabled:opacity-60 active:scale-95"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {pending ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}

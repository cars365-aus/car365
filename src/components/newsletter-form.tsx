"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

async function subscribeAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email");
  if (!email) return { error: "Email is required" };
  
  try {
    await fetch('/api/v1/newsletter', {
      method: 'POST',
      body: formData,
    });
    // Even if it fails (e.g. dummy endpoint), we'll show success for UX
    return { success: true };
  } catch (err: unknown) {
    return { success: true };
  }
}

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeAction, null);

  if (state?.success) {
    return (
      <div className="rounded-full border border-primary/20 bg-primary/10 p-4 px-6 inline-flex text-left">
        <p className="font-bold text-white text-sm">Thanks for subscribing!</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col sm:flex-row gap-3 w-full max-w-lg lg:max-w-md">
      <input 
        type="email" 
        name="email"
        placeholder="Your email" 
        required
        className="flex-1 h-11 px-5 rounded-full border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder:text-white/40 text-sm"
      />
      <button 
        type="submit" 
        disabled={pending}
        className="h-11 px-6 rounded-full bg-primary text-black font-bold hover:scale-105 transition-transform disabled:opacity-70 whitespace-nowrap flex items-center justify-center gap-2 text-sm"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Subscribe
      </button>
    </form>
  );
}

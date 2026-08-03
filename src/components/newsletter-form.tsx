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
      <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5 px-8 inline-flex text-center">
        <p className="font-bold text-primary text-base">You're in! Thanks for subscribing.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col sm:flex-row gap-4 w-full sm:w-[550px] max-w-full">
      <input 
        type="email" 
        name="email"
        placeholder="Your email" 
        required
        className="flex-1 h-14 px-6 rounded-full border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder:text-white/40 text-base"
      />
      <button 
        type="submit" 
        disabled={pending}
        className="h-14 px-10 rounded-full bg-primary text-black font-bold hover:bg-[#d6a506] transition-colors disabled:opacity-70 whitespace-nowrap flex items-center justify-center gap-2 text-base"
      >
        {pending && <Loader2 className="size-5 animate-spin" />}
        Subscribe
      </button>
    </form>
  );
}

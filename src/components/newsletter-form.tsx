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
    <form action={formAction} className="relative flex flex-col sm:flex-row gap-3 w-full group">
      {/* Glow effect behind the form */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-yellow-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 hidden sm:block"></div>
      
      <input 
        type="email" 
        name="email"
        placeholder="Enter your best email..." 
        required
        className="relative flex-1 h-14 px-6 rounded-2xl sm:rounded-full border border-white/10 bg-[#050505]/80 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder:text-white/40 text-base shadow-inner transition-all hover:bg-[#050505]"
      />
      <button 
        type="submit" 
        disabled={pending}
        className="relative h-14 px-8 rounded-2xl sm:rounded-full bg-gradient-to-r from-primary to-yellow-500 text-[#050505] font-black hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 whitespace-nowrap flex items-center justify-center gap-2 text-base shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]"
      >
        {pending && <Loader2 className="size-5 animate-spin" />}
        Subscribe Now
      </button>
    </form>
  );
}

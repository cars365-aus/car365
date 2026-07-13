"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (!data.session) {
        setSuccess("Account created! Please check your email for a confirmation link.");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setError("Invalid email or password. If you just signed up, please ensure you have confirmed your email address.");
        } else {
          setError(signInError.message);
        }
      }
    }
    
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-border">
        <div className="p-8">
          <div className="mb-6 text-center">
            <DialogTitle className="font-heading text-2xl font-bold text-foreground">
              {mode === "signin" ? "Welcome back" : "Create an account"}
            </DialogTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin" 
                ? "Sign in to view prices and contact dealers." 
                : "Register to unlock premium marketplace features."}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-foreground">Email</span>
              <input
                type="email" required autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-black/50 px-3 py-2.5 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-foreground">Password</span>
              <input
                type="password" required autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-black/50 px-3 py-2.5 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                placeholder="••••••••"
              />
            </label>
            {error ? <p className="text-sm text-danger font-medium">{error}</p> : null}
            {success ? <p className="text-sm text-success font-medium">{success}</p> : null}
            <button
              type="submit" disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-bold text-black hover:bg-primary-hover disabled:opacity-60 transition-transform hover:scale-[1.02] shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : null}
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button" 
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setSuccess(null);
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

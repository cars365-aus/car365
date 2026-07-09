"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface GoogleAuthButtonProps {
  /** The user-selected role that drives the post-login destination. */
  role: "customer" | "vendor";
  /** The resolved safe next route (e.g. from resolveNextRoute(role)). */
  nextRoute: string;
  /** Optional plan carried through to the callback. */
  plan?: string | null;
  /** Surfaces auth errors to a parent (e.g. AuthPanel) for shared rendering. */
  onError?: (message: string | null) => void;
  /** Allows a parent to disable the button (e.g. while another method is busy). */
  disabled?: boolean;
}

/**
 * Google OAuth sign-in button.
 *
 * Contains the existing `signInWithOAuth` Google logic extracted verbatim from
 * the sign-in page: role-aware `redirectTo` targeting `/auth/callback`,
 * `prompt: select_account`, and loading/error states.
 */
export function GoogleAuthButton({
  role,
  nextRoute,
  plan,
  onError,
  disabled,
}: GoogleAuthButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn() {
    setIsSubmitting(true);
    onError?.(null);
    const supabase = createClient();

    sessionStorage.setItem("auth_intended_role", role);

    const callbackParams = new URLSearchParams({
      next: nextRoute,
      role,
    });
    if (plan) callbackParams.set("plan", plan);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?${callbackParams.toString()}`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (signInError) {
      onError?.(signInError.message);
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      size="cta"
      onClick={signIn}
      disabled={disabled || isSubmitting}
      className="w-full sm:w-auto sm:min-w-[280px]"
      aria-label="Continue with Google sign-in"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          Continue with Google
          <ArrowRight className="h-5 w-5 transition-transform group-hover/button:translate-x-0.5" />
        </>
      )}
    </Button>
  );
}

export default GoogleAuthButton;

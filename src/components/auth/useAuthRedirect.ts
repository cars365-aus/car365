"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { syncProfile } from "@/app/actions/auth-sync";
import {
  isSafeRedirectPath,
  resolvePostAuthDestination,
  type AuthRole,
} from "@/lib/routing";

/** Inputs for resolving a destination from role + candidate redirect params. */
export interface AuthRedirectByRole {
  /** The user-selected role driving the default post-login destination. */
  role: AuthRole | null;
  /** Candidate `next` redirect target (e.g. from `redirectedFrom`). */
  next?: string | null;
  /** Optional plan carried through to vendor upgrade destinations. */
  plan?: string | null;
}

export interface UseAuthRedirect {
  /**
   * Syncs the profile, then navigates to an already-resolved, safe
   * same-origin destination. Unsafe values fall back to the customer default.
   */
  redirectToDestination: (destination: string) => Promise<void>;
  /**
   * Syncs the profile, then navigates to the destination produced by
   * `resolvePostAuthDestination` for the given role / next / plan.
   */
  redirectByRole: (input: AuthRedirectByRole) => Promise<void>;
}

/**
 * Shared post-authentication redirect hook for the email and phone forms.
 *
 * After a Supabase session has been established client-side, this hook calls
 * the `syncProfile` server action (which upserts the `profiles` row using the
 * cookie-bound server session) and then performs an App Router client
 * navigation to the resolved destination.
 *
 * It intentionally adds no new redirect rules: destinations are resolved via
 * the existing `resolvePostAuthDestination` helper, and any directly supplied
 * destination is guarded with `isSafeRedirectPath` before navigation to avoid
 * unsafe targets reaching `router.replace`.
 */
export function useAuthRedirect(): UseAuthRedirect {
  const router = useRouter();

  const redirectToDestination = useCallback(
    async (destination: string) => {
      await syncProfile();

      // Defensive: only ever navigate to safe same-origin relative paths.
      const safeDestination = isSafeRedirectPath(destination)
        ? destination
        : resolvePostAuthDestination(null);

      router.replace(safeDestination);
      router.refresh();
    },
    [router],
  );

  const redirectByRole = useCallback(
    async ({ role, next, plan }: AuthRedirectByRole) => {
      const destination = resolvePostAuthDestination(role, next, plan);
      await redirectToDestination(destination);
    },
    [redirectToDestination],
  );

  return { redirectToDestination, redirectByRole };
}

export default useAuthRedirect;

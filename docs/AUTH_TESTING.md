# Multi-Method Auth — Manual Test Checklist & Configuration Notes

Cars365 supports three sign-in methods, all delegated to Supabase Auth: Google OAuth, email + password, and phone OTP. This document covers the manual verification checklist for those flows and the Supabase dashboard configuration they depend on.

See also: `docs/SECURITY.md` (auth boundaries), `docs/ARCHITECTURE.md` (system overview).

## Manual Test Checklist

Run through these before shipping any change that touches the sign-in surface (`/auth/sign-in`), `/auth/callback`, `/auth/sign-out`, `middleware.ts`, or the `src/lib/auth/*` and `src/components/auth/*` modules. Each item should be confirmed in a fresh browser session.

| # | Scenario | Steps | Expected result |
| --- | --- | --- | --- |
| 1 | Google login still works | Select a role, choose Google, complete the Google consent screen | Redirected through `/auth/callback` to the role-appropriate dashboard; session is active |
| 2 | Email signup | Open the Email section, switch to signup, enter a valid email + policy-compliant password (and matching confirmation), submit | Account is created via `signUp`; either redirected to the dashboard (if a session is returned) or shown a "check your email to confirm" message (see Email confirmation note below) |
| 3 | Email login | In the Email section (login mode), enter valid credentials, submit | Session established and redirected to the role-appropriate dashboard |
| 4 | Wrong-password clean error | In the Email section (login mode), enter a valid email with an incorrect password | Friendly "invalid email or password" message is shown; no raw Supabase payload; no disclosure of whether the email exists |
| 5 | Phone OTP request | In the Phone section, enter a number in E.164 format (e.g. `+919876543210`), submit | Advances to the code-entry step and shows a "code sent" success state |
| 6 | Phone OTP verify | Enter the received code and submit | Session established and redirected to the role-appropriate dashboard |
| 7 | Logout | While authenticated, invoke sign-out | Session terminated via `signOut`; redirected to the home route (`/`) |
| 8 | Protected-route redirect when unauthenticated | While logged out, navigate directly to a protected path (`/customer`, `/vendor`, `/messages`, `/admin`) | Redirected to `/auth/sign-in?redirectedFrom=<path>`; access is denied |
| 9 | Authenticated access after login | After logging in (any method), navigate to the role-appropriate protected dashboard | Page loads without a redirect to sign-in |
| 10 | Page-refresh session persistence | While authenticated, hard-refresh a protected page | Session is restored from cookies; no re-authentication is required |
| 11 | Profile row — Google | Sign in with Google for a new user, then inspect the `profiles` table | A row keyed on the user id exists with `email`, `full_name`, and `avatar_url` populated from Google metadata; `phone` is null |
| 12 | Profile row — email | Sign up/in with email for a new user, then inspect the `profiles` table | A row exists with `email` populated; `phone` and (typically) `avatar_url`/`full_name` null; `updated_at` set |
| 13 | Profile row — phone | Verify a phone OTP for a new user, then inspect the `profiles` table | A row exists with `phone` populated; `email` null; the upsert does not fail despite the missing email |

Notes:
- Items 11–13 confirm Requirement 7 (profile sync is null-safe for users lacking an email or a phone).
- Item 4 confirms the sanitized error mapping (Requirement 8.5) — the raw provider response must never reach the UI.

## Supabase Dashboard Configuration

These flows rely on Supabase project settings that are **not** controlled by environment variables. Configure them in the Supabase dashboard.

### (a) Phone provider + SMS provider (required for Phone OTP)

Phone OTP only works when the Phone provider is enabled and backed by an SMS gateway:

1. In the Supabase dashboard, open **Authentication → Providers → Phone** and enable it.
2. Configure an **SMS provider** (e.g. Twilio or MessageBird) with the gateway credentials in the same settings panel.

Without this configuration, `supabase.auth.signInWithOtp` returns a provider error. The Phone form does not silently disable itself — it surfaces a friendly **"phone sign-in temporarily unavailable"** message and stays on the phone-entry step (Requirement 4.8).

### (b) Email confirmation setting (affects Email signup)

The **"Confirm email"** setting under **Authentication → Sign In / Providers → Email** (sometimes shown as the email confirmation toggle in **Authentication → Settings**) determines the signup behavior:

- **Confirm email ON** — `supabase.auth.signUp` succeeds **without** returning an active session. The email form shows a "check your email to confirm" message and does not redirect. The user activates the session by clicking the confirmation link.
- **Confirm email OFF** — `supabase.auth.signUp` returns an **active session** immediately. The email form treats this like a successful login and redirects via the post-login resolver.

The email form handles both branches, so either setting is supported — just be aware of which behavior to expect during testing.

## Environment Variables

This feature introduces **no new authentication environment variables**. All three methods reuse variables already documented in `.env.example`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (browser + server clients) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key for the browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key, server-only, used by the admin client for profile upserts |
| `NEXT_PUBLIC_APP_URL` | Base URL used to build redirect targets |

The Phone OTP and email-confirmation behaviors are governed by the Supabase dashboard settings above, not by env vars, so no additions to `.env.example` are required.

# Requirements Document

## Introduction

This feature adds two new authentication methods to the existing Hire Car (Carhire) Next.js + Supabase application while preserving the current Google OAuth login. Today the only way to sign in is by selecting a role (customer or vendor) on `/auth/sign-in` and authenticating with Google via `supabase.auth.signInWithOAuth`. This feature adds (1) email + password signup/login and (2) phone number OTP login, with all three methods routing exclusively through Supabase Auth.

No custom authentication tables, custom password storage, or manual session systems are introduced. The browser client (`src/lib/supabase/client.ts`), server client (`src/lib/supabase/server.ts`), admin client (`src/lib/supabase/admin.ts`), the `/auth/callback` route, the `/auth/sign-out` route, `middleware.ts` route protection, and the `routing.ts` redirect-safety helpers are the existing primitives that the new methods must reuse. The `profiles` table (id, full_name, email, phone, created_at, updated_at) must continue to be populated for every authenticated user regardless of method, and must not assume that every user has an email (phone-only users) or a phone (Google/email users).

All three methods must converge on the same authenticated Supabase session behavior, the same post-login redirect logic (`resolvePostAuthDestination`), and the same role-aware destinations (`/customer/dashboard` for customers, `/vendor/upgrade` for vendors) that Google login produces today.

## Glossary

- **Auth_System**: The application-side authentication surface (sign-in page, auth helper modules, callback route, sign-out route) that delegates all credential and session operations to Supabase Auth.
- **Supabase_Auth**: The managed Supabase authentication service accessed through `@supabase/ssr` and `@supabase/supabase-js` clients. The single source of truth for identities, credentials, and sessions.
- **Browser_Client**: The client-side Supabase instance created by `createClient()` in `src/lib/supabase/client.ts`, configured with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Server_Client**: The server-side Supabase instance created by `createClient()` in `src/lib/supabase/server.ts`, used in route handlers and server components with cookie-based session handling.
- **Admin_Client**: The service-role Supabase instance created by `createAdminClient()` in `src/lib/supabase/admin.ts`, used only in trusted server code and never exposed to the browser.
- **Google_OAuth_Flow**: The existing role-selection + `signInWithOAuth` Google login on `/auth/sign-in` that redirects through `/auth/callback`.
- **Email_Password_Flow**: The new authentication path using `supabase.auth.signUp` and `supabase.auth.signInWithPassword`.
- **Phone_OTP_Flow**: The new authentication path using `supabase.auth.signInWithOtp` and `supabase.auth.verifyOtp` with a phone number.
- **Auth_Callback**: The `GET /auth/callback` route handler that exchanges an OAuth/PKCE code for a session and syncs the profile.
- **Profile_Sync**: The operation that upserts a row into the `profiles` table for the authenticated user using the `Admin_Client`.
- **Profiles_Table**: The `public.profiles` table with columns `id`, `full_name`, `email`, `phone`, `created_at`, `updated_at`.
- **Auth_Role**: The user-selected intent of `customer` or `vendor` that drives the post-login destination.
- **Redirect_Resolver**: The `resolvePostAuthDestination` / `isSafeRedirectPath` logic in `src/lib/routing.ts` that produces safe same-origin post-login destinations.
- **Protected_Route**: Any path matched by `middleware.ts` as requiring authentication (`/customer`, `/vendor`, `/messages`, `/admin`).
- **Session**: The authenticated Supabase session persisted via SSR cookies and readable by `Browser_Client`, `Server_Client`, and `middleware.ts`.
- **International_Phone_Format**: A phone number in E.164 form consisting of a leading `+`, a country code, and subscriber digits (e.g. `+919876543210`).
- **SMS_Provider**: The third-party SMS gateway configured in the Supabase dashboard that delivers Phone OTP messages.

## Requirements

### Requirement 1: Preserve the existing Google OAuth flow

**User Story:** As a returning user, I want the existing Google sign-in to keep working exactly as before, so that my login experience and access are not disrupted by the new auth methods.

#### Acceptance Criteria

1. WHERE the user selects a role and chooses Google sign-in, THE Auth_System SHALL initiate authentication using `supabase.auth.signInWithOAuth` with the `google` provider and a `redirectTo` targeting `/auth/callback`.
2. WHEN the Google_OAuth_Flow returns to `/auth/callback` with a valid code, THE Auth_Callback SHALL exchange the code for a Session using `supabase.auth.exchangeCodeForSession`.
3. WHEN the Google_OAuth_Flow completes successfully, THE Auth_System SHALL redirect the user to the destination produced by the Redirect_Resolver using the selected Auth_Role and any `next`/`plan` parameters.
4. IF the Google code exchange fails, THEN THE Auth_Callback SHALL redirect to `/auth/sign-in?error=auth_failed` without exposing internal error details.
5. THE Auth_System SHALL preserve the existing role selection (`customer` or `vendor`) behavior that drives the Google post-login destination.

### Requirement 2: Email and password signup

**User Story:** As a new user, I want to create an account with my email and password, so that I can access the platform without a Google account.

#### Acceptance Criteria

1. WHEN a user submits the signup form with a syntactically valid email and a password that satisfies the password policy, THE Auth_System SHALL create the account using `supabase.auth.signUp`.
2. IF the password and confirm-password values do not match, THEN THE Auth_System SHALL reject the submission, display a validation message, and SHALL NOT call `supabase.auth.signUp`.
3. IF the submitted email is not a syntactically valid email address, THEN THE Auth_System SHALL reject the submission, display a validation message, and SHALL NOT call `supabase.auth.signUp`.
4. IF the submitted password does not satisfy the documented password policy, THEN THE Auth_System SHALL reject the submission, display a validation message, and SHALL NOT call `supabase.auth.signUp`.
5. WHILE a signup request is in progress, THE Auth_System SHALL disable the submit control and display a loading indicator.
6. WHERE Supabase email confirmation is enabled and signup succeeds without an active Session, THE Auth_System SHALL display a message instructing the user to confirm their email address.
7. WHERE signup succeeds and returns an active Session, THE Auth_System SHALL redirect the user to the destination produced by the Redirect_Resolver.
8. IF `supabase.auth.signUp` returns an error, THEN THE Auth_System SHALL display a friendly error message and SHALL NOT display the raw Supabase error payload.
9. THE Auth_System SHALL NOT store, hash, or transmit the password to any destination other than Supabase_Auth.

### Requirement 3: Email and password login

**User Story:** As a returning user with an email account, I want to log in with my email and password, so that I can reach my dashboard.

#### Acceptance Criteria

1. WHEN a user submits the login form with an email and password, THE Auth_System SHALL authenticate using `supabase.auth.signInWithPassword`.
2. WHILE a login request is in progress, THE Auth_System SHALL disable the submit control and display a loading indicator.
3. WHEN login succeeds, THE Auth_System SHALL establish a Session and redirect the user to the destination produced by the Redirect_Resolver.
4. IF the credentials are invalid, THEN THE Auth_System SHALL display a friendly "invalid email or password" message and SHALL NOT reveal whether the email exists.
5. IF `supabase.auth.signInWithPassword` returns any error, THEN THE Auth_System SHALL display a friendly error message and SHALL NOT display the raw Supabase error payload.
6. THE Auth_System SHALL allow the user to toggle between the login and signup views within the email section.

### Requirement 4: Phone number OTP login

**User Story:** As a user, I want to log in with my phone number using a one-time code, so that I can access the platform without a password or Google account.

#### Acceptance Criteria

1. WHEN a user submits a phone number in International_Phone_Format, THE Auth_System SHALL request a one-time code using `supabase.auth.signInWithOtp`.
2. IF the submitted phone number is not in International_Phone_Format, THEN THE Auth_System SHALL reject the request, display a validation message, and SHALL NOT call `supabase.auth.signInWithOtp`.
3. WHEN the one-time code request succeeds, THE Auth_System SHALL advance to the code-entry step and display a success message that a code has been sent.
3a. IF the one-time code request fails, THEN THE Auth_System SHALL remain on the phone-entry step and SHALL NOT advance to the code-entry step.
4. WHEN a user submits the received one-time code, THE Auth_System SHALL verify it using `supabase.auth.verifyOtp` with the `sms` type and the submitted phone number.
5. WHEN OTP verification succeeds, THE Auth_System SHALL establish a Session and redirect the user to the destination produced by the Redirect_Resolver.
6. IF OTP verification fails, THEN THE Auth_System SHALL display a friendly error message and allow the user to retry code entry.
7. WHILE an OTP request or verification is in progress, THE Auth_System SHALL disable the relevant submit control and display a loading indicator.
8. IF the SMS_Provider is not configured and `supabase.auth.signInWithOtp` returns a provider error, THEN THE Auth_System SHALL display a friendly message indicating phone sign-in is temporarily unavailable, rather than silently disabling phone authentication.
9. WHERE the SMS_Provider is not configured, THE Auth_System SHALL document the required Supabase dashboard configuration in developer-facing notes.

### Requirement 5: Unified authentication UI

**User Story:** As a user, I want a single clean sign-in screen with clearly separated Google, email, and phone options, so that I can choose my preferred method without confusion.

#### Acceptance Criteria

1. THE Auth_System SHALL present the Google, Email_Password_Flow, and Phone_OTP_Flow options on the `/auth/sign-in` screen using tabbed or sectioned navigation.
2. THE Auth_System SHALL provide a control to toggle the email section between login and signup modes.
3. THE Auth_System SHALL present the Phone_OTP_Flow as a two-step flow: phone entry, then code entry.
4. WHILE any authentication request is in progress, THE Auth_System SHALL disable the submit control that initiated the request while leaving other authentication methods selectable.
5. WHEN an authentication error occurs, THE Auth_System SHALL display a human-readable message and SHALL NOT render the raw Supabase error payload.
6. WHEN a one-time code request to Supabase_Auth succeeds, THE Auth_System SHALL display a success state in the Phone_OTP_Flow, and SHALL NOT display the success state when the code request fails.
7. THE Auth_System SHALL render all authentication options using the existing shadcn component library and Tailwind styling tokens.

### Requirement 6: Unified session and redirect handling

**User Story:** As a user, I want every login method to produce the same authenticated experience, so that route protection, logout, and session persistence behave consistently.

#### Acceptance Criteria

1. WHEN authentication succeeds through any of the three methods, THE Auth_System SHALL establish a Session readable by the Browser_Client, the Server_Client, and `middleware.ts`.
2. WHEN authentication succeeds, THE Auth_System SHALL compute the post-login destination using the Redirect_Resolver so that all methods share the same redirect rules as the Google_OAuth_Flow.
3. IF a post-login destination is supplied via a redirect parameter that is not a safe same-origin relative path, THEN THE Auth_System SHALL use the role-appropriate default destination instead.
4. WHEN an unauthenticated user requests a Protected_Route, THE Auth_System SHALL redirect the user to `/auth/sign-in` with a `redirectedFrom` parameter.
5. WHEN a user invokes sign-out, THE Auth_System SHALL terminate the Session using `supabase.auth.signOut` and redirect to the home route.
6. WHEN an authenticated user reloads a page, THE Auth_System SHALL restore the Session from cookies without requiring re-authentication.
7. IF the redirect to `/auth/sign-in` for an unauthenticated Protected_Route request cannot be performed, THEN THE Auth_System SHALL deny access to the Protected_Route rather than allow the request through.

### Requirement 7: Profile synchronization for all methods

**User Story:** As the platform, I want a profile row maintained for every authenticated user regardless of auth method, so that downstream features relying on `profiles` work for Google, email, and phone users.

#### Acceptance Criteria

1. WHEN a user authenticates through any of the three methods, THE Profile_Sync SHALL upsert a Profiles_Table row keyed on the Supabase user id using the Admin_Client.
2. WHERE the authenticated user has an email, THE Profile_Sync SHALL store the email in the Profiles_Table `email` column.
3. WHERE the authenticated user has a phone number, THE Profile_Sync SHALL store the phone number in the Profiles_Table `phone` column.
4. WHERE Google user metadata provides a full name, THE Profile_Sync SHALL store it in the Profiles_Table `full_name` column.
5. WHERE the authenticated user has no email, THE Profile_Sync SHALL store a null email and SHALL NOT fail the upsert.
6. WHERE the authenticated user has no phone number, THE Profile_Sync SHALL store a null phone and SHALL NOT fail the upsert.
7. WHERE Google user metadata provides an avatar URL, THE Profile_Sync SHALL persist it to a Profiles_Table avatar column.
8. THE Profile_Sync SHALL set the Profiles_Table `updated_at` column to the current timestamp on every upsert.

### Requirement 8: Authentication security controls

**User Story:** As a security-conscious operator, I want the new auth methods to follow Supabase security best practices, so that secrets are protected and the auth surface is not exploitable.

#### Acceptance Criteria

1. THE Auth_System SHALL use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Browser_Client code.
2. THE Auth_System SHALL reference `SUPABASE_SERVICE_ROLE_KEY` only in server-side code and SHALL NOT expose it to the browser.
3. THE Auth_System SHALL delegate all credential verification and session creation to Supabase_Auth and SHALL NOT implement custom password hashing or session storage.
4. WHEN building a post-login redirect, THE Auth_System SHALL accept only safe same-origin relative paths as validated by `isSafeRedirectPath`.
5. WHEN displaying an authentication error, THE Auth_System SHALL present a sanitized message and SHALL NOT leak internal identifiers, stack traces, or raw provider responses.
6. THE Auth_System SHALL validate email format, password policy, and phone format before invoking Supabase_Auth.
7. WHERE Profiles_Table access requires a Row Level Security change to support any of the three methods, THE Auth_System SHALL apply the minimal forward migration that preserves the existing "own or admin" read and "own" update policies.

### Requirement 9: Environment and configuration documentation

**User Story:** As a developer setting up the project, I want accurate environment and dashboard configuration documentation, so that I can run all three auth methods without guessing.

#### Acceptance Criteria

1. THE Auth_System SHALL rely on the already-documented `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_APP_URL` variables and SHALL NOT introduce new authentication environment variables unless a new method strictly requires one.
2. THE Auth_System SHALL document the Supabase dashboard configuration required to enable the Phone_OTP_Flow, including SMS_Provider setup.
3. WHERE Supabase email confirmation behavior affects the Email_Password_Flow, THE Auth_System SHALL document the relevant Supabase dashboard setting.
4. IF a new environment variable is genuinely required, THEN THE Auth_System SHALL add it to `.env.example` with an explanatory comment.

### Requirement 10: Code reuse and quality

**User Story:** As a maintainer, I want the new auth code to reuse existing utilities and stay small and typed, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. THE Auth_System SHALL reuse the existing `Browser_Client`, `Server_Client`, and `Admin_Client` factories rather than instantiating new Supabase clients inline.
2. THE Auth_System SHALL reuse the existing `Redirect_Resolver` helpers in `src/lib/routing.ts` for post-login destination computation.
3. THE Auth_System SHALL implement input validation as typed functions that return structured results consumable by the UI.
4. THE Auth_System SHALL avoid duplicating authentication logic across the email, phone, and Google paths where shared helpers are feasible.

### Requirement 11: Verification and testing

**User Story:** As a maintainer, I want the new auth methods verified through automated tests and a manual checklist, so that regressions in any method are caught.

#### Acceptance Criteria

1. THE Auth_System SHALL include automated tests for email format validation, password policy validation, password-confirmation matching, and International_Phone_Format validation using the existing Vitest and fast-check setup.
2. THE Auth_System SHALL include automated tests asserting that the Redirect_Resolver rejects unsafe redirect targets and accepts safe same-origin relative paths.
3. THE Auth_System SHALL include automated tests asserting that Profile_Sync derives id, email, phone, full name, and avatar fields with correct null fallbacks for users lacking an email or phone.
4. THE Auth_System SHALL provide a manual test checklist covering: Google login still works, email signup, email login, wrong-password clean error, phone OTP request, phone OTP verify, logout, Protected_Route redirect when unauthenticated, authenticated access after login, page-refresh session persistence, and profile creation for all three methods.

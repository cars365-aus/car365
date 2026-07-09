"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Mail, KeyRound, Lock, Key } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/auth/validation";
import { toFriendlyAuthError } from "@/lib/auth/errors";
import { useAuthRedirect } from "@/components/auth/useAuthRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailAuthFormProps {
  /** The user-selected role that drives the post-login destination. */
  role: "customer" | "vendor";
  /** The resolved safe next route (e.g. from resolveNextRoute(role)). */
  nextRoute: string;
  /** Optional plan carried through to the email-confirmation callback link. */
  plan?: string | null;
  /** Surfaces auth errors to a parent (e.g. AuthPanel) for shared rendering. */
  onError?: (message: string | null) => void;
  /** Allows a parent to disable the form (e.g. while another method is busy). */
  disabled?: boolean;
}

/** Per-field validation messages shown inline beneath each input. */
interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  otp?: string;
}

type AuthMode = "sign-in" | "sign-up" | "otp";

export function EmailAuthForm({
  role,
  nextRoute,
  plan,
  onError,
  disabled,
}: EmailAuthFormProps) {
  const { redirectToDestination } = useAuthRedirect();

  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  function validateEmailInput(): boolean {
    const errors: FieldErrors = {};
    const emailResult = validateEmail(email);
    if (!emailResult.ok) errors.email = emailResult.message;
    setFieldErrors((prev) => ({ ...prev, email: errors.email }));
    return !errors.email;
  }

  function validatePasswordInput(): boolean {
    const errors: FieldErrors = {};
    if (!password || password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (mode === "sign-up" && password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors((prev) => ({ ...prev, password: errors.password, confirmPassword: errors.confirmPassword }));
    return !errors.password && !errors.confirmPassword;
  }

  function validateOtpInput(): boolean {
    const errors: FieldErrors = {};
    if (!otp || otp.length !== 6) errors.otp = "Please enter the 6-digit code.";
    setFieldErrors((prev) => ({ ...prev, otp: errors.otp }));
    return !errors.otp;
  }

  async function handleForgotPassword() {
    onError?.(null);
    if (!validateEmailInput()) return;
    setIsSubmitting(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
      });
      if (error) {
        onError?.(toFriendlyAuthError(error));
      } else {
        setForgotPasswordSent(true);
      }
    } catch (err) {
      onError?.(toFriendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || isSubmitting) return;

    onError?.(null);
    if (!validateEmailInput() || !validatePasswordInput()) return;

    setIsSubmitting(true);
    const supabase = createClient();
    sessionStorage.setItem("auth_intended_role", role);

    try {
      if (mode === "sign-up") {
        const callbackParams = new URLSearchParams({ next: nextRoute, role });
        if (plan) callbackParams.set("plan", plan);

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?${callbackParams.toString()}`,
            data: {
              role: role
            }
          },
        });

        if (error) {
          onError?.(toFriendlyAuthError(error));
        } else {
          setSignupSuccess(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          onError?.(toFriendlyAuthError(error));
        } else {
          await redirectToDestination(nextRoute);
        }
      }
    } catch (err) {
      onError?.(toFriendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || isSubmitting) return;

    onError?.(null);
    if (!validateEmailInput()) return;

    setIsSubmitting(true);
    const supabase = createClient();
    sessionStorage.setItem("auth_intended_role", role);

    try {
      const callbackParams = new URLSearchParams({ next: nextRoute, role });
      if (plan) callbackParams.set("plan", plan);

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?${callbackParams.toString()}`,
          data: {
            role: role
          }
        },
      });

      if (error) {
        onError?.(toFriendlyAuthError(error));
      } else {
        setOtpSent(true);
      }
    } catch (err) {
      onError?.(toFriendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || isSubmitting) return;

    onError?.(null);
    if (!validateOtpInput()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: "magiclink",
      });

      if (error || !data.session) {
        onError?.(toFriendlyAuthError(error));
        setIsSubmitting(false);
        return;
      }

      await redirectToDestination(nextRoute);
    } catch (err) {
      onError?.(toFriendlyAuthError(err));
      setIsSubmitting(false);
    }
  }

  // Render forgot-password success message
  if (forgotPasswordSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-6">
          <Mail className="mx-auto h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold text-lg mb-2">Check your email</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setForgotPasswordSent(false);
              setMode("sign-in");
            }}
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Render post-signup success message
  if (signupSuccess) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-6">
          <Mail className="mx-auto h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold text-lg mb-2">Check your email</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We've sent a verification link to <span className="font-medium text-foreground">{email}</span>
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSignupSuccess(false);
              setMode("sign-in");
            }}
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Render OTP verification input
  if (mode === "otp" && otpSent) {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email-auth-otp">Enter verification code</Label>
          <Input
            id="email-auth-otp"
            type="text"
            name="otp"
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder="123456"
            value={otp}
            maxLength={6}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            disabled={disabled || isSubmitting}
            aria-invalid={Boolean(fieldErrors.otp)}
          />
          {fieldErrors.otp ? (
            <p className="text-sm text-destructive" role="alert">
              {fieldErrors.otp}
            </p>
          ) : (
             <p className="text-sm text-muted-foreground">
               Enter the 6-digit code we just sent to your email, or click the Magic Link in the email.
             </p>
          )}
        </div>

        <Button
          type="submit"
          size="cta"
          disabled={disabled || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Verifying...</>
          ) : (
            <><KeyRound className="h-5 w-5" /> Verify & Sign In</>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtp("");
              onError?.(null);
            }}
            disabled={disabled || isSubmitting}
            className="font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            Use a different email
          </button>
        </p>
      </form>
    );
  }

  // Render Main Auth Form (Password Sign-in / Sign-up OR Email OTP Sender)
  return (
    <div className="space-y-6">
      <form onSubmit={mode === "otp" ? handleSendOtp : handlePasswordAuth} className="space-y-4" noValidate>
        
        {/* Email Input is always visible */}
        <div className="space-y-2">
          <Label htmlFor="email-auth-email">Email address</Label>
          <Input
            id="email-auth-email"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={disabled || isSubmitting}
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email && (
            <p className="text-sm text-destructive" role="alert">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password Inputs (Only if mode is sign-in or sign-up) */}
        {mode !== "otp" && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-auth-password">Password</Label>
                {mode === "sign-in" && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending..." : "Forgot password?"}
                  </button>
                )}
              </div>
              <Input
                id="email-auth-password"
                type="password"
                name="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={disabled || isSubmitting}
                aria-invalid={Boolean(fieldErrors.password)}
              />
              {fieldErrors.password && (
                <p className="text-sm text-destructive" role="alert">{fieldErrors.password}</p>
              )}
            </div>

            {mode === "sign-up" && (
              <div className="space-y-2">
                <Label htmlFor="email-auth-confirm-password">Confirm Password</Label>
                <Input
                  id="email-auth-confirm-password"
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={disabled || isSubmitting}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-sm text-destructive" role="alert">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="cta"
          disabled={disabled || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Please wait...</>
          ) : mode === "otp" ? (
            <><Mail className="h-5 w-5" /> Send Code <ArrowRight className="h-5 w-5 transition-transform group-hover/button:translate-x-0.5" /></>
          ) : mode === "sign-in" ? (
            <><KeyRound className="h-5 w-5" /> Sign In <ArrowRight className="h-5 w-5 transition-transform group-hover/button:translate-x-0.5" /></>
          ) : (
            <><Lock className="h-5 w-5" /> Create Account <ArrowRight className="h-5 w-5 transition-transform group-hover/button:translate-x-0.5" /></>
          )}
        </Button>
      </form>

      {/* Mode Switchers */}
      <div className="flex flex-col items-center gap-3 pt-2">
        {mode === "otp" ? (
          <button
            type="button"
            onClick={() => { setMode("sign-in"); onError?.(null); }}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            I want to use my password
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setMode("otp"); onError?.(null); }}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in with a code or link instead
          </button>
        )}

        <div className="h-px w-full max-w-[200px] bg-border my-2" />

        <div className="text-sm">
          {mode === "sign-in" ? (
            <span className="text-muted-foreground">
              Don't have an account?{" "}
              <button 
                type="button"
                onClick={() => { setMode("sign-up"); onError?.(null); }}
                className="font-semibold text-primary hover:underline"
              >
                Sign up
              </button>
            </span>
          ) : mode === "sign-up" ? (
            <span className="text-muted-foreground">
              Already have an account?{" "}
              <button 
                type="button"
                onClick={() => { setMode("sign-in"); onError?.(null); }}
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </button>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default EmailAuthForm;

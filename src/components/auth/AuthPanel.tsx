"use client";

import { useState } from "react";
import {
  User,
  Store,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import {
  resolvePostAuthDestination,
  type AuthRole,
} from "@/lib/routing";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";

interface AuthPanelProps {
  /** Candidate redirect target from the `redirectedFrom` query param. */
  redirectedFrom?: string | null;
  /** Optional plan carried through to vendor upgrade destinations. */
  plan?: string | null;
  /** Whether the page was reached because admin MFA is required. */
  mfaRequired?: boolean;
}

type AuthMethod = "google" | "email";

const METHOD_TABS: ReadonlyArray<{
  id: AuthMethod;
  label: string;
  icon: typeof Globe;
}> = [
  { id: "google", label: "Google", icon: Globe },
  { id: "email", label: "Email", icon: Mail },
];

const ROLE_OPTIONS: ReadonlyArray<{
  id: AuthRole;
  title: string;
  description: string;
  icon: typeof User;
}> = [
  {
    id: "customer",
    title: "I am a Customer",
    description: "Discover, compare, and rent vehicles.",
    icon: User,
  },
  {
    id: "vendor",
    title: "I am a Vendor",
    description: "List my fleet and receive leads.",
    icon: Store,
  },
];

/**
 * Unified sign-in panel composing the Google, Email, and Phone authentication
 * methods behind tabbed navigation.
 *
 * AuthPanel owns the `customer`/`vendor` role selection that drives the
 * post-login destination and renders shared authentication errors. Each child
 * method receives the selected role, the resolved safe `nextRoute` (computed
 * with `resolvePostAuthDestination`), the optional `plan`, and an `onError`
 * callback used for shared error rendering. The method tabs are only revealed
 * once a role is selected, preserving the existing "choose how you'll use the
 * platform" gate from the previous Google-only flow.
 */
export function AuthPanel({
  redirectedFrom,
  plan,
  mfaRequired,
}: AuthPanelProps) {
  const [selectedRole, setSelectedRole] = useState<AuthRole | null>(null);
  const [activeMethod, setActiveMethod] = useState<AuthMethod>("google");
  const [error, setError] = useState<string | null>(null);

  const nextRoute = selectedRole
    ? resolvePostAuthDestination(selectedRole, redirectedFrom, plan)
    : null;

  function selectRole(role: AuthRole) {
    setSelectedRole(role);
    setError(null);
  }

  return (
    <Card variant="elevated" className="w-full max-w-[768px] py-8 sm:py-10">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <BrandLogo
            priority
            className="h-[48px] w-[180px] sm:h-[56px] sm:w-[220px]"
          />
        </div>
        <div>
          <CardTitle
            className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            Welcome to Hire Car
          </CardTitle>
          <p className="mt-2 text-muted-foreground">
            How would you like to use our platform today?
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {mfaRequired && (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            <p className="font-medium">
              Admin access requires two-factor authentication.
            </p>
            <p className="mt-1">
              Sign in, enroll MFA in your account, then visit{" "}
              <a href="/auth/mfa" className="font-semibold underline">
                /auth/mfa
              </a>
              .
            </p>
          </div>
        )}

        {/* Shared authentication error */}
        {error && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-destructive/80">
              {error.includes("credentials") || error.includes("password")
                ? "Please check your credentials and try again."
                : error.includes("network") || error.includes("fetch")
                ? "Check your internet connection and try again."
                : "Please try again or contact support if the issue persists."}
            </p>
          </div>
        )}

        {/* Role Selection Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedRole === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectRole(option.id)}
                aria-pressed={isSelected}
                className={`group relative flex flex-col items-center justify-center rounded-xl border-2 p-6 text-center transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-md"
                }`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full mb-3 transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">
                  {option.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
                {isSelected && (
                  <div className="absolute top-3 right-3 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Method tabs + active method — revealed once a role is selected */}
        {selectedRole && nextRoute ? (
          <div className="space-y-6">
            <div
              role="tablist"
              aria-label="Sign-in method"
              className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1"
            >
              {METHOD_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeMethod === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`auth-tab-${tab.id}`}
                    aria-selected={isActive}
                    aria-controls={`auth-panel-${tab.id}`}
                    onClick={() => {
                      setActiveMethod(tab.id);
                      setError(null);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id={`auth-panel-${activeMethod}`}
              aria-labelledby={`auth-tab-${activeMethod}`}
            >
              {activeMethod === "google" && (
                <div className="flex flex-col items-center gap-4">
                  <GoogleAuthButton
                    role={selectedRole}
                    nextRoute={nextRoute}
                    plan={plan}
                    onError={setError}
                  />
                </div>
              )}

              {activeMethod === "email" && (
                <EmailAuthForm
                  role={selectedRole}
                  nextRoute={nextRoute}
                  plan={plan}
                  onError={setError}
                />
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Select how you want to use Hire Car to continue.
          </p>
        )}

        {/* Dev sign-in buttons (development only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-2 flex gap-6 justify-center border-t border-border pt-4">
            <button
              onClick={async () => {
                setSelectedRole("customer");
                setError(null);
                const supabase = createClient();
                sessionStorage.setItem("auth_intended_role", "customer");
                const { error: devError } = await supabase.auth.signInWithPassword({
                  email: "customer@example.com",
                  password: "password123",
                });
                if (devError) {
                  setError(devError.message);
                } else {
                  window.location.href = resolvePostAuthDestination(
                    "customer",
                    redirectedFrom,
                    plan,
                  );
                }
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Dev: Customer
            </button>
            <button
              onClick={async () => {
                setSelectedRole("vendor");
                setError(null);
                const supabase = createClient();
                sessionStorage.setItem("auth_intended_role", "vendor");
                const { error: devError } = await supabase.auth.signInWithPassword({
                  email: "vendor@example.com",
                  password: "password123",
                });
                if (devError) {
                  setError(devError.message);
                } else {
                  window.location.href = resolvePostAuthDestination(
                    "vendor",
                    redirectedFrom,
                    plan,
                  );
                }
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Dev: Vendor
            </button>
            <button
              onClick={async () => {
                setError(null);
                const supabase = createClient();
                const { error: devError } = await supabase.auth.signInWithPassword({
                  email: "admin@example.com",
                  password: "password123",
                });
                if (devError) {
                  setError(devError.message);
                } else {
                  window.location.href = redirectedFrom || "/admin";
                }
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Dev: Admin
            </button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </CardContent>
    </Card>
  );
}

export default AuthPanel;

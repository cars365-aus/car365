"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Users, MessageCircle, BadgeDollarSign } from "lucide-react";
import { AuthPanel } from "@/components/auth/AuthPanel";

function SignInContent() {
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom");
  const plan = searchParams.get("plan");
  const mfaRequired = searchParams.get("reason") === "mfa-required";

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20">
      {/* Value Proposition Panel — Desktop only (≥1024px) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.03em" }}>
              Australia&apos;s trusted car hire marketplace
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Connect with verified local operators and find the perfect vehicle for your journey.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Verified operators</h3>
                <p className="text-sm text-muted-foreground">
                  Every vendor is verified for quality and reliability before joining our platform.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Direct communication</h3>
                <p className="text-sm text-muted-foreground">
                  Message vendors directly via WhatsApp, phone, or our inquiry system.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BadgeDollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">No hidden fees</h3>
                <p className="text-sm text-muted-foreground">
                  Transparent pricing from local operators — what you see is what you pay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 py-12 sm:px-6 lg:px-12">
        <AuthPanel
          redirectedFrom={redirectedFrom}
          plan={plan}
          mfaRequired={mfaRequired}
        />
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20" />
      }
    >
      <SignInContent />
    </Suspense>
  );
}

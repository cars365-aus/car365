"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { Skeleton } from "@/components/ui/skeleton";

export function HeaderAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [profileHref, setProfileHref] = useState("/customer/dashboard");
  const [profileLabel, setProfileLabel] = useState("My Account");
  const [isVendor, setIsVendor] = useState(false);
  const [vendorUpgradeHref, setVendorUpgradeHref] = useState("/vendor/upgrade");
  const [listFleetLabel, setListFleetLabel] = useState("List Your Fleet");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    
    const loadUserContext = async (hasSession: boolean) => {
      if (!hasSession) {
        setProfileHref("/account");
        setProfileLabel("My Account");
        setIsVendor(false);
        setVendorUpgradeHref("/vendor/upgrade");
        setListFleetLabel("List Your Fleet");
        return;
      }

      try {
        const res = await fetch("/api/user/context");
        if (res.ok) {
          const data = await res.json();
          setProfileHref(data.profileHref ?? "/account");
          setProfileLabel(data.profileLabel ?? "My Account");
          setIsVendor(!!data.isVendor);
          setVendorUpgradeHref(data.vendorUpgradeHref ?? "/vendor/upgrade");
          setListFleetLabel(data.listFleetLabel ?? "List Your Fleet");
        }
      } catch {
        setProfileHref("/account");
        setProfileLabel("My Account");
        setIsVendor(false);
        setVendorUpgradeHref("/vendor/upgrade");
        setListFleetLabel("List Your Fleet");
      }
    };

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      await loadUserContext(loggedIn);
      setIsLoadingAuth(false);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      await loadUserContext(loggedIn);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoadingAuth) {
    return (
      <div className="hidden md:flex items-center gap-3">
        <Skeleton className="h-11 w-32 rounded-full" />
        <Skeleton className="h-11 w-36 rounded-full" />
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="hidden md:flex items-center gap-3">
        {isVendor ? (
          <Link href="/account" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
            My Enquiries
          </Link>
        ) : (
          <Link href={vendorUpgradeHref} className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
            {listFleetLabel}
          </Link>
        )}
        <Link href={profileHref} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ea580c] to-amber-500 hover:from-[#c2410c] hover:to-[#ea580c] text-white font-bold text-sm px-7 py-3 rounded-full transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5">
          <User className="h-4 w-4" />
          {profileLabel}
        </Link>
      </div>
    );
  }

  return (
    <Link href="/auth/sign-in" className="hidden md:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-7 py-3 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
      Log in / Sign up
    </Link>
  );
}

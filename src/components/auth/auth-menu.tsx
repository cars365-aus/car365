"use client";

import { useAuth } from "./auth-provider";
import { User, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

export function AuthMenu() {
  const { user, isLoggedIn, loading, openAuthModal, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center size-10">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <button 
        onClick={openAuthModal}
        className="hidden items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 sm:inline-flex border border-white/10 transition-colors"
      >
        <User className="size-4" /> Sign In
      </button>
    );
  }

  return (
    <div className="hidden group relative sm:inline-flex items-center">
      <button className="flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 border border-white/10 transition-colors">
        <User className="size-4" /> {user?.email?.split('@')[0]}
      </button>
      <div className="invisible absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-card p-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <a
          href="/account"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted mb-1"
        >
          <User className="size-4" /> My Account
        </a>
        <a
          href="/admin"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted mb-1 border-b border-border pb-3"
        >
          <span className="size-4 flex items-center justify-center font-bold font-mono">A</span> Admin Panel
        </a>
        <button
          onClick={async () => {
            setSigningOut(true);
            await signOut();
            setSigningOut(false);
          }}
          disabled={signingOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-muted mt-1"
        >
          {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />} 
          Sign out
        </button>
      </div>
    </div>
  );
}

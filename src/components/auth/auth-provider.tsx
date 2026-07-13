"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "./auth-modal";

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  requireAuth: (callback: () => void) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Stable client: creating it inline on every render made `supabase.auth` a new
  // reference each render, so the effect below re-subscribed and setState'd in a
  // loop — which continuously re-rendered the tree and stopped Base UI dialogs
  // from ever completing their enter animation (they stuck at opacity-0).
  // Stable client: creating it inline on every render made `supabase.auth` a new
  // reference each render, so the auth effect re-subscribed and setState'd in a
  // loop — which continuously re-rendered the tree and stopped Base UI dialogs
  // from ever completing their enter animation (stuck at opacity-0).
  const [supabase] = useState(() => createClient());

  // Auth subscription — set up ONCE (supabase is stable).
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close the modal + run any pending action once the user becomes logged in.
  // Reacting to external auth state is a legitimate effect here.
  useEffect(() => {
    if (user && isModalOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsModalOpen(false);
      if (pendingCallback) {
        pendingCallback();
        setPendingCallback(null);
      }
    }
  }, [user, isModalOpen, pendingCallback]);

  const openAuthModal = useCallback(() => setIsModalOpen(true), []);
  const closeAuthModal = useCallback(() => {
    setIsModalOpen(false);
    setPendingCallback(null);
  }, []);

  const requireAuth = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      setPendingCallback(() => callback);
      setIsModalOpen(true);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, openAuthModal, closeAuthModal, requireAuth, signOut }}>
      {children}
      <AuthModal isOpen={isModalOpen} onClose={closeAuthModal} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "./auth-modal";

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  openAuthModal: (intent?: "buyer" | "seller") => void;
  closeAuthModal: () => void;
  requireAuth: (callback: () => void) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIntent, setModalIntent] = useState<"buyer" | "seller">("buyer");
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const [supabase] = useState(() => createClient());

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

  useEffect(() => {
    if (user && isModalOpen) {
      setIsModalOpen(false);
      if (pendingCallback) {
        pendingCallback();
        setPendingCallback(null);
      }
    }
  }, [user, isModalOpen, pendingCallback]);

  const openAuthModal = useCallback((intent: "buyer" | "seller" = "buyer") => {
    setModalIntent(intent);
    setIsModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsModalOpen(false);
    setPendingCallback(null);
  }, []);

  const requireAuth = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      setPendingCallback(() => callback);
      setModalIntent("buyer");
      setIsModalOpen(true);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, openAuthModal, closeAuthModal, requireAuth, signOut }}>
      {children}
      <AuthModal isOpen={isModalOpen} onClose={closeAuthModal} intent={modalIntent} />
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

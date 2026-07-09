"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface MobileState {
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (val: boolean) => void;
  isStickyCtaVisible: boolean;
  setIsStickyCtaVisible: (val: boolean) => void;
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
}

const MobileStateContext = createContext<MobileState | undefined>(undefined);

export function MobileStateProvider({ children }: { children: ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isStickyCtaVisible, setIsStickyCtaVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <MobileStateContext.Provider 
      value={{ 
        isMobileNavOpen, 
        setIsMobileNavOpen, 
        isStickyCtaVisible, 
        setIsStickyCtaVisible, 
        isModalOpen, 
        setIsModalOpen 
      }}
    >
      {children}
    </MobileStateContext.Provider>
  );
}

export function useMobileState() {
  const context = useContext(MobileStateContext);
  if (context === undefined) {
    throw new Error("useMobileState must be used within a MobileStateProvider");
  }
  return context;
}

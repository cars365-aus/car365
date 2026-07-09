"use client";

import { useEffect } from "react";
import { useMobileState } from "@/components/mobile-state-provider";

export function StickyCtaNotifier() {
  const { setIsStickyCtaVisible } = useMobileState();
  
  useEffect(() => {
    setIsStickyCtaVisible(true);
    return () => setIsStickyCtaVisible(false);
  }, [setIsStickyCtaVisible]);
  
  return null;
}

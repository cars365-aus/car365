"use client";

import { useCallback, useState } from "react";
import { FinanceCalculator, type FinanceSnapshot } from "@/components/finance-calculator";
import { FinanceForm } from "@/components/leads/finance-form";
import type { FinanceParams } from "@/lib/domain";

/**
 * Wires the finance calculator to the enquiry form: as the buyer adjusts the
 * sliders, their deposit and weekly repayment flow into the enquiry fields
 * (until they hand-edit them). Client boundary so both panels can share state.
 */
export function FinancePanels({
  params,
  price,
  vehicleId,
  phone,
  whatsappUrl,
}: {
  params: FinanceParams;
  price: number;
  vehicleId?: string;
  phone?: string | null;
  whatsappUrl?: string | null;
}) {
  const [linked, setLinked] = useState<{ deposit: number; weekly: number }>({
    deposit: Math.round((params.depositPct / 100) * price),
    weekly: 0,
  });

  const handleChange = useCallback((s: FinanceSnapshot) => {
    setLinked({ deposit: s.deposit, weekly: s.weekly });
  }, []);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <FinanceCalculator params={params} price={price} onChange={handleChange} />
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-bold text-foreground">Enquire about finance</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">A specialist will contact you — no obligation.</p>
        <FinanceForm
          vehicleId={vehicleId}
          phone={phone}
          whatsappUrl={whatsappUrl}
          deposit={linked.deposit}
          weekly={linked.weekly}
        />
      </div>
    </div>
  );
}

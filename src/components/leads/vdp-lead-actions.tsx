"use client";

import Link from "next/link";
import { Phone, MessageCircle, Mail, CalendarClock } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VehicleEnquiryForm } from "@/components/leads/vehicle-enquiry-form";
import { InspectionForm } from "@/components/leads/inspection-form";
import { cn } from "@/lib/utils";

function track(vehicleId: string, channel: "call" | "whatsapp" | "enquire") {
  // Fire-and-forget; never blocks the click.
  try {
    navigator.sendBeacon?.(
      "/api/v1/cta-clicks",
      new Blob([JSON.stringify({ vehicleId, channel })], { type: "application/json" }),
    );
  } catch {
    /* ignore */
  }
}

export function VdpLeadActions({
  vehicleId,
  vehicleTitle,
  phone,
  whatsappUrl,
  showInspection = true,
  showFinance = true,
  showTradeIn = true,
  variant = "card",
}: {
  vehicleId: string;
  vehicleTitle: string;
  phone?: string | null;
  whatsappUrl?: string | null;
  showInspection?: boolean;
  showFinance?: boolean;
  showTradeIn?: boolean;
  variant?: "card" | "sticky";
}) {
  const enquireBtn = variant === "sticky"
    ? "flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold text-foreground"
    : "flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-semibold text-foreground hover:bg-muted";

  const primaryBtn = variant === "sticky"
    ? "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold"
    : "flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold";

  return (
    <div className={cn(variant === "sticky" ? "flex gap-2" : "space-y-2")}>
      {phone ? (
        <a href={`tel:${phone}`} onClick={() => track(vehicleId, "call")} className={cn(primaryBtn, "bg-primary text-primary-foreground hover:bg-primary-hover")}>
          <Phone className={variant === "sticky" ? "size-4" : "size-5"} /> {variant === "sticky" ? "Call" : `Call ${phone}`}
        </a>
      ) : null}
      {whatsappUrl ? (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => track(vehicleId, "whatsapp")} className={cn(primaryBtn, "bg-success text-white hover:opacity-90")}>
          <MessageCircle className={variant === "sticky" ? "size-4" : "size-5"} /> WhatsApp
        </a>
      ) : null}

      <Dialog>
        <DialogTrigger onClick={() => track(vehicleId, "enquire")} className={enquireBtn}>
          <Mail className={variant === "sticky" ? "size-4" : "size-5"} /> Enquire
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogTitle>Enquire about this car</DialogTitle>
          <p className="mb-3 text-sm text-muted-foreground">{vehicleTitle}</p>
          <VehicleEnquiryForm vehicleId={vehicleId} vehicleTitle={vehicleTitle} phone={phone} whatsappUrl={whatsappUrl} />
        </DialogContent>
      </Dialog>

      {variant === "card" ? (
        <div className="grid grid-cols-1 gap-2 pt-1">
          {showInspection ? (
            <Dialog>
              <DialogTrigger className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                <CalendarClock className="size-4" /> Book an inspection
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                <DialogTitle>Book an inspection</DialogTitle>
                <p className="mb-3 text-sm text-muted-foreground">{vehicleTitle}</p>
                <InspectionForm vehicleId={vehicleId} phone={phone} whatsappUrl={whatsappUrl} />
              </DialogContent>
            </Dialog>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            {showFinance ? (
              <Link href={`/finance?vehicle=${vehicleId}`} className="rounded-lg border border-border px-3 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted">Finance this car</Link>
            ) : null}
            {showTradeIn ? (
              <Link href={`/trade-in?vehicle=${vehicleId}`} className="rounded-lg border border-border px-3 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted">Trade-in your car</Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

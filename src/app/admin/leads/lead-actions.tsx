"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateLeadStatus, addLeadNote, assignLeadToMe, markLeadSpam, deleteLead } from "./actions";
import { LEAD_STATUS_ORDER, LEAD_STATUS_LABELS, LOSS_REASONS, LOSS_REASON_LABELS } from "@/lib/leads/status";
import type { LeadStatus } from "@/lib/domain";

export function LeadActions({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newStatus, setNewStatus] = useState<LeadStatus>(status);
  const [lossReason, setLossReason] = useState<string>("price");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteTimeoutRef = useRef<NodeJS.Timeout>(null);

  function run(fn: () => Promise<{ error?: string; ok?: boolean }>, successMessage?: string) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        if (successMessage) toast.success(successMessage);
        router.refresh();
      }
    });
  }

  const handleDeleteClick = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = setTimeout(() => setConfirmingDelete(false), 3000);
    } else {
      run(() => deleteLead(leadId), "Lead deleted");
    }
  };

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Update status</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            {LEAD_STATUS_ORDER.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </select>
          {newStatus === "lost" ? (
            <select value={lossReason} onChange={(e) => setLossReason(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
              {LOSS_REASONS.map((r) => <option key={r} value={r}>{LOSS_REASON_LABELS[r]}</option>)}
            </select>
          ) : null}
          <button
            disabled={pending || newStatus === status}
            onClick={() => run(() => updateLeadStatus({ leadId, status: newStatus, lossReason: newStatus === "lost" ? lossReason : undefined }), "Status updated")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Add a note</h3>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" placeholder="Call notes, next steps…" />
        <button
          disabled={pending || !note.trim()}
          onClick={() => run(async () => { const r = await addLeadNote({ leadId, note }); if (!r.error) setNote(""); return r; }, "Note added")}
          className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          Add note
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button disabled={pending} onClick={() => run(() => assignLeadToMe(leadId), "Assigned to you")} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">Assign to me</button>
        <button disabled={pending} onClick={() => run(() => markLeadSpam(leadId), "Marked as spam")} className="rounded-lg border border-warning/40 px-3 py-2 text-sm font-medium text-warning hover:bg-warning/10 disabled:opacity-50">Mark as spam</button>
        <button
          disabled={pending}
          onClick={handleDeleteClick}
          className={`rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 transition-colors ${confirmingDelete ? "border-danger bg-danger text-white hover:bg-danger/90 font-bold" : "border-danger/40 text-danger hover:bg-danger/10"}`}
        >
          {confirmingDelete ? "Click to confirm delete" : "Delete"}
        </button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

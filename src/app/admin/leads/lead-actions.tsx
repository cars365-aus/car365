"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

  function run(fn: () => Promise<{ error?: string; ok?: boolean }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

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
            onClick={() => run(() => updateLeadStatus({ leadId, status: newStatus, lossReason: newStatus === "lost" ? lossReason : undefined }))}
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
          onClick={() => run(async () => { const r = await addLeadNote({ leadId, note }); if (!r.error) setNote(""); return r; })}
          className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          Add note
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button disabled={pending} onClick={() => run(() => assignLeadToMe(leadId))} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">Assign to me</button>
        <button disabled={pending} onClick={() => run(() => markLeadSpam(leadId))} className="rounded-lg border border-warning/40 px-3 py-2 text-sm font-medium text-warning hover:bg-warning/10 disabled:opacity-50">Mark as spam</button>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
              run(() => deleteLead(leadId));
            }
          }}
          className="rounded-lg border border-danger/40 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

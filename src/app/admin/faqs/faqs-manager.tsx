"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, X } from "lucide-react";
import { saveFaq, deleteFaq } from "./actions";

type Faq = { id: string; category: string; question: string; answer: string; sort_order: number; is_published: boolean };

const input = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground";
const CATEGORIES = ["Buying", "Selling", "Finance", "Warranty", "Inspections"];

export function FaqsManager({ items }: { items: Faq[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [pending, startTransition] = useTransition();
  const [state, formAction] = useActionState(saveFaq, undefined);

  if (state?.ok && showForm) {
    setShowForm(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">FAQs</h1>
          <p className="text-sm text-muted-foreground">{items.length} total</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(!showForm); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />} {showForm ? "Cancel" : "Add FAQ"}
        </button>
      </div>

      {showForm ? (
        <form action={formAction} className="space-y-3 rounded-xl border border-border bg-card p-5">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">Category *</span>
              <input name="category" list="faq-cats" required defaultValue={editing?.category} className={input} />
              <datalist id="faq-cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">Sort order</span><input type="number" name="sortOrder" defaultValue={editing?.sort_order ?? 0} className={input} /></label>
          </div>
          <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">Question *</span><input name="question" required defaultValue={editing?.question} className={input} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">Answer *</span><textarea name="answer" required rows={3} defaultValue={editing?.answer} className={input} /></label>
          <label className="flex items-center gap-2 text-sm text-body"><input type="checkbox" name="isPublished" defaultChecked={editing?.is_published ?? true} className="size-4 rounded border-border" /> Published</label>
          {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Save FAQ</button>
        </form>
      ) : null}

      <div className="space-y-3">
        {items.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No FAQs yet.</p> : items.map((f) => (
          <div key={f.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{f.category}</span>
                  {!f.is_published ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Hidden</span> : null}
                </div>
                <p className="mt-1 font-medium text-foreground">{f.question}</p>
                <p className="mt-1 text-sm text-body">{f.answer}</p>
              </div>
              <div className="flex flex-none gap-2">
                <button disabled={pending} onClick={() => { setEditing(f); setShowForm(true); }} className="text-sm text-primary hover:underline">Edit</button>
                <button disabled={pending} onClick={() => startTransition(async () => { await deleteFaq(f.id); router.refresh(); })} className="text-danger hover:opacity-70"><Trash2 className="size-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

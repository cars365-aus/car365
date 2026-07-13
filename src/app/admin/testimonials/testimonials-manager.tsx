"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2, Plus, X } from "lucide-react";
import { saveTestimonial, toggleTestimonialApproved, deleteTestimonial } from "./actions";

type Testimonial = {
  id: string;
  customer_name: string;
  rating: number;
  quote: string;
  source: string;
  review_date: string | null;
  is_approved: boolean;
  sort_order: number;
};

const input = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground";

export function TestimonialsManager({ items }: { items: Testimonial[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [pending, startTransition] = useTransition();
  const [state, formAction] = useActionState(saveTestimonial, undefined);

  // Close the form + refresh after a successful save.
  if (state?.ok && showForm) {
    setShowForm(false);
    setEditing(null);
    router.refresh();
  }

  const act = (fn: () => Promise<unknown>) => startTransition(async () => { await fn(); router.refresh(); });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Testimonials</h1>
          <p className="text-sm text-muted-foreground">{items.length} total · only approved ones show on the site.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(!showForm); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />} {showForm ? "Cancel" : "Add testimonial"}
        </button>
      </div>

      {showForm ? (
        <form action={formAction} className="space-y-3 rounded-xl border border-border bg-card p-5">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">Customer name *</span><input name="customerName" required defaultValue={editing?.customer_name} className={input} /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">Rating *</span>
              <select name="rating" defaultValue={editing?.rating ?? 5} className={input}>{[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} stars</option>)}</select>
            </label>
          </div>
          <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">Quote *</span><textarea name="quote" required rows={3} defaultValue={editing?.quote} className={input} /></label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">Source</span>
              <select name="source" defaultValue={editing?.source ?? "google"} className={input}><option value="google">Google</option><option value="facebook">Facebook</option><option value="direct">Direct</option></select>
            </label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">Review date</span><input type="date" name="reviewDate" defaultValue={editing?.review_date ?? ""} className={input} /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">Sort order</span><input type="number" name="sortOrder" defaultValue={editing?.sort_order ?? 0} className={input} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm text-body"><input type="checkbox" name="isApproved" defaultChecked={editing?.is_approved ?? true} className="size-4 rounded border-border" /> Approved (visible on site)</label>
          {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Save testimonial</button>
        </form>
      ) : null}

      <div className="space-y-3">
        {items.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No testimonials yet.</p> : items.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{t.customer_name}</span>
                  <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3.5 ${i < t.rating ? "fill-warning text-warning" : "text-border"}`} />)}</span>
                  {!t.is_approved ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Draft</span> : null}
                </div>
                <p className="mt-1 text-sm text-body">&ldquo;{t.quote}&rdquo;</p>
              </div>
              <div className="flex flex-none gap-2">
                <button disabled={pending} onClick={() => { setEditing(t); setShowForm(true); }} className="text-sm text-primary hover:underline">Edit</button>
                <button disabled={pending} onClick={() => act(() => toggleTestimonialApproved(t.id, !t.is_approved))} className="text-sm text-body hover:underline">{t.is_approved ? "Unapprove" : "Approve"}</button>
                <button disabled={pending} onClick={() => act(() => deleteTestimonial(t.id))} className="text-danger hover:opacity-70"><Trash2 className="size-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

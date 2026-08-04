import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getBackfillCounts } from "@/lib/data/syndication";

/**
 * Syndication readiness banner for the inventory list.
 *
 * This is the surface Sprint 1 exists to create. The Task 0 audit found 100% of
 * active vehicles missing a VIN, which meant Google Vehicle Ads would reject
 * every listing — no adapter could be built until that number moved. This
 * banner makes the number visible to the people who can fix it, and the counts
 * come from the same `evaluateReadiness` the sync engine will use, so it can
 * never disagree with what a channel actually rejects.
 *
 * Renders nothing once everything is ready, so it disappears when its job is
 * done rather than becoming permanent furniture.
 */
export async function SyndicationBackfillBanner() {
  let counts;
  try {
    counts = await getBackfillCounts();
  } catch {
    // The sidecar tables may not exist yet (migration 0014 not applied).
    // A missing syndication table must never break the inventory screen.
    return null;
  }

  if (counts.candidates === 0) return null;

  const blocked = counts.candidates - counts.ready;

  if (blocked === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm">
        <CheckCircle2 className="size-4 shrink-0 text-success" />
        <span className="text-foreground">
          All {counts.candidates} active vehicles are ready to syndicate.
        </span>
      </div>
    );
  }

  const items: { label: string; count: number }[] = [
    { label: "missing a VIN", count: counts.missingVin },
    { label: "with an invalid or duplicate VIN", count: counts.invalidVin },
    { label: "missing a price type", count: counts.missingPriceType },
    { label: "with no photos", count: counts.missingImages },
    { label: "needing a written-off disclosure", count: counts.wovrUndisclosed },
  ].filter((i) => i.count > 0);

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {blocked} of {counts.candidates} active vehicles cannot be advertised yet
          </p>
          <ul className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
            {items.map((i) => (
              <li key={i.label}>
                <span className="font-medium text-foreground">{i.count}</span> {i.label}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Open a vehicle and complete the Identity &amp; Compliance section to clear these.{" "}
            <Link href="/admin/inventory?status=available" className="font-medium text-primary hover:underline">
              Show active stock
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

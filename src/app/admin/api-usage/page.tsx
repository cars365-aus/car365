import { AlertTriangle, ExternalLink, Info, ServerCog } from "lucide-react";
import {
  API_PROVIDERS,
  PLANNED_PROVIDERS,
  TRACKED_PROVIDER_CODES,
  estimateCost,
  isProviderConfigured,
  quotaUsedPct,
  type ApiProvider,
} from "@/lib/observability/providers";
import { getUsage, type ProviderUsage } from "@/lib/observability/usage";

export const metadata = { title: "API Usage" };
export const dynamic = "force-dynamic";

/** Rolling window the dashboard reports on. */
const WINDOW_DAYS = 30;

const CATEGORY_LABELS: Record<ApiProvider["category"], string> = {
  infrastructure: "Infrastructure",
  communications: "Communications",
  search: "Search",
  security: "Security",
  geocoding: "Geocoding",
  monitoring: "Monitoring",
  syndication: "Syndication",
};

const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const num = new Intl.NumberFormat("en-AU");

function StatusPill({ configured, planned }: { configured: boolean; planned: boolean }) {
  if (planned) {
    return <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Planned</span>;
  }
  return configured ? (
    <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">Connected</span>
  ) : (
    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Not configured</span>
  );
}

function QuotaBar({ pct }: { pct: number }) {
  const tone = pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-success";
  return (
    <div className="mt-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <span className="mt-1 block text-xs text-muted-foreground">{pct.toFixed(1)}% of monthly quota</span>
    </div>
  );
}

/**
 * API usage & cost dashboard.
 *
 * Reads counters recorded by `src/lib/observability/usage.ts` (Redis, or
 * per-instance memory when `REDIS_URL` is unset). It touches no application
 * tables — nothing here reads or writes vehicles, leads or any other business
 * data, so it cannot affect the listings.
 *
 * Costs shown are ESTIMATES derived from requests this application made times
 * published unit pricing. They are not a bill, and the page says so.
 */
export default async function ApiUsagePage() {
  const usage = await getUsage(TRACKED_PROVIDER_CODES, WINDOW_DAYS);
  const byCode = new Map<string, ProviderUsage>(usage.providers.map((p) => [p.code, p]));

  const totalRequests = usage.providers.reduce((sum, p) => sum + p.requests, 0);
  const totalErrors = usage.providers.reduce((sum, p) => sum + p.errors, 0);
  const totalCost = API_PROVIDERS.reduce((sum, provider) => {
    const cost = estimateCost(provider, byCode.get(provider.code)?.requests ?? 0);
    return sum + (cost ?? 0);
  }, 0);
  const peakDay = usage.daily.reduce((max, d) => Math.max(max, d.requests), 0);

  const rows = [...API_PROVIDERS, ...PLANNED_PROVIDERS];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
          <ServerCog className="size-6 text-primary" />
          API usage &amp; cost
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Outbound calls this site made to third-party services over the last {WINDOW_DAYS} days.
        </p>
      </header>

      {/* Honesty banner. An admin acting on these numbers as if they were an
          invoice would make bad decisions, so the caveat is prominent, not
          buried in a tooltip. */}
      <div className="flex gap-2.5 rounded-xl border border-border bg-muted/40 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">These costs are estimates, not a bill.</span>{" "}
            They multiply the requests this site made by each provider&apos;s published unit price. They exclude
            anything billed on storage, bandwidth or active users, and exclude calls made from other environments.
            Always confirm real spend in the provider&apos;s own console.
          </p>
          {!usage.durable ? (
            <p className="text-warning">
              <span className="font-semibold">REDIS_URL is not configured</span>, so counters are held in this
              server instance&apos;s memory only. On a multi-instance or serverless deployment these numbers will
              undercount and reset on every deploy.
            </p>
          ) : null}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Requests", value: num.format(totalRequests), hint: `${WINDOW_DAYS}-day total` },
          { label: "Errors", value: num.format(totalErrors), hint: totalRequests > 0 ? `${((totalErrors / totalRequests) * 100).toFixed(1)}% of calls` : "—" },
          { label: "Estimated cost", value: aud.format(totalCost), hint: "Metered services only" },
          { label: "Busiest day", value: num.format(peakDay), hint: "Requests in a single day" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="mt-1.5 font-heading text-2xl font-bold text-foreground">{card.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Daily trend — a pure-CSS bar chart, no charting bundle shipped. */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Requests per day</h2>
        <div className="mt-4 flex h-28 items-end gap-[3px]" role="img" aria-label={`Daily request volume over the last ${WINDOW_DAYS} days`}>
          {usage.daily.map((d) => {
            const height = peakDay > 0 ? Math.max(2, (d.requests / peakDay) * 100) : 2;
            return (
              <div
                key={d.date}
                className="flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
                style={{ height: `${height}%` }}
                title={`${d.date}: ${num.format(d.requests)} requests, ${num.format(d.errors)} errors`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{usage.daily[0]?.date}</span>
          <span>{usage.daily[usage.daily.length - 1]?.date}</span>
        </div>
      </section>

      {/* Per-provider detail */}
      <section className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Requests</th>
              <th className="px-4 py-3 text-right font-medium">Errors</th>
              <th className="px-4 py-3 text-right font-medium">Avg time</th>
              <th className="px-4 py-3 text-right font-medium">Est. cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((provider) => {
              const planned = PLANNED_PROVIDERS.some((p) => p.code === provider.code);
              const stats = byCode.get(provider.code);
              const configured = isProviderConfigured(provider);
              const cost = stats ? estimateCost(provider, stats.requests) : null;
              const pct = stats ? quotaUsedPct(provider, stats.requests) : null;

              return (
                <tr key={provider.code} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{provider.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[provider.category]} · {provider.planLabel}
                    </div>
                    <a
                      href={provider.consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Open console <ExternalLink className="size-3" />
                    </a>
                    {pct != null ? <QuotaBar pct={pct} /> : null}
                    {provider.notes ? (
                      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">{provider.notes}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3"><StatusPill configured={configured} planned={planned} /></td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {provider.tracked ? num.format(stats?.requests ?? 0) : <span className="text-muted-foreground">Not counted</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {provider.tracked ? (
                      (stats?.errors ?? 0) > 0
                        ? <span className="inline-flex items-center gap-1 font-medium text-destructive"><AlertTriangle className="size-3.5" />{num.format(stats!.errors)}</span>
                        : <span className="text-muted-foreground">0</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {stats?.avgMs != null ? `${num.format(stats.avgMs)} ms` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {cost != null ? aud.format(cost) : <span className="text-muted-foreground">Not per-call</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="text-xs text-muted-foreground">
        Quotas and unit prices are recorded in <code className="rounded bg-muted px-1 py-0.5">src/lib/observability/providers.ts</code>{" "}
        and were last verified on {API_PROVIDERS[0].pricingCheckedOn}. Re-check them when a provider changes plans.
      </p>
    </div>
  );
}

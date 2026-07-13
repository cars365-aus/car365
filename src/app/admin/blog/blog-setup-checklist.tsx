import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { runBlogPreflight } from "@/lib/blog/preflight";

export async function BlogSetupChecklist() {
  const preflight = await runBlogPreflight();

  return (
    <Card variant="default" className={preflight.ready ? "border-emerald-200" : "border-amber-200"}>
      <CardContent className="p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Setup checklist</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {preflight.ready
              ? "Ready for automatic daily posting once deployed to Vercel with cron enabled."
              : "Complete the items below before automatic posting will work."}
          </p>
        </div>

        <ul className="space-y-2">
          {preflight.checks.map((check) => (
            <li key={check.id} className="flex items-start gap-2 text-sm">
              <StatusIcon ok={check.ok} optional={check.id === "unsplash"} />
              <div>
                <span className="font-medium">{check.label}</span>
                <span className="text-muted-foreground"> — {check.detail}</span>
              </div>
            </li>
          ))}
        </ul>

        {!preflight.ready && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
            <p className="font-semibold mb-1">Manual steps required</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-800">
              <li>Run Supabase migrations: <code className="text-xs">20260618100000_blog_articles.sql</code> and <code className="text-xs">20260618110000_blog_daily_unique.sql</code></li>
              <li>Set <code className="text-xs">GEMINI_API_KEY</code> in Vercel + .env.local</li>
              <li>Set <code className="text-xs">CRON_SECRET</code> (16+ random chars, no spaces) in Vercel for daily cron auth</li>
              <li>Set <code className="text-xs">UNSPLASH_ACCESS_KEY</code> (optional fallback for images)</li>
              <li>Deploy to Vercel — cron runs daily at 06:00 UTC via vercel.json</li>
            </ol>
          </div>
        )}

        <div className="rounded-lg bg-muted border border-border p-3 text-sm text-muted-foreground">
          <p className="font-semibold mb-1">What runs automatically vs manually</p>
          <ul className="space-y-1">
            <li><strong>Automatic (after setup):</strong> Vercel cron → generate article → image → publish to /blog</li>
            <li><strong>Manual (one-time):</strong> Database migrations, env vars, Vercel deploy</li>
            <li><strong>Manual (testing):</strong> Admin → Blog → &quot;Generate today&apos;s article&quot;</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusIcon({ ok, optional }: { ok: boolean; optional?: boolean }) {
  if (ok) return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />;
  if (optional) return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
  return <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />;
}

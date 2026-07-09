import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Code2, Key, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Vendor Fleet API | Hire Car",
  description: "REST API documentation for Pro vendors to sync vehicle listings.",
};

export default function VendorApiDocsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link href="/for-vendors" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#ea580c] mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to For Vendors
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Fleet API (Pro)</h1>
              <p className="text-sm text-slate-500">Manage vehicles programmatically</p>
            </div>
          </div>

          <section className="prose prose-slate max-w-none">
            <h2>Authentication</h2>
            <p>
              Create an API key in{" "}
              <Link href="/vendor/settings">Vendor Settings</Link> (Pro plan required).
              Pass it as a Bearer token:
            </p>
            <pre className="rounded-xl bg-slate-900 text-slate-100 p-4 text-sm overflow-x-auto">
{`Authorization: Bearer hc_live_xxxxxxxx`}
            </pre>

            <h2>Base URL</h2>
            <pre className="rounded-xl bg-slate-100 p-4 text-sm">https://www.hirecarmarketplace.com.au/api/v1</pre>

            <h2>Endpoints</h2>
            <ul>
              <li><code>GET /vehicles</code> — List your fleet</li>
              <li><code>POST /vehicles</code> — Create a listing (status: pending)</li>
              <li><code>PUT /vehicles/:id</code> — Update a listing</li>
              <li><code>DELETE /vehicles/:id</code> — Archive a listing</li>
            </ul>

            <h3>Create vehicle example</h3>
            <pre className="rounded-xl bg-slate-900 text-slate-100 p-4 text-sm overflow-x-auto">
{`POST /api/v1/vehicles
Content-Type: application/json
Authorization: Bearer hc_live_xxx

{
  "title": "2024 Toyota Camry",
  "make": "Toyota",
  "model": "Camry",
  "year": 2024,
  "category": "Sedan",
  "pricePerDayAud": 89,
  "branchId": "uuid-of-branch",
  "seats": 5,
  "fuel": "Petrol",
  "transmission": "Automatic"
}`}
            </pre>

            <p className="flex items-start gap-2 text-sm text-slate-600 not-prose">
              <Key className="h-4 w-4 shrink-0 mt-0.5" />
              New listings require admin approval before appearing in search. Rate limits apply per API key.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

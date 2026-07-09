import Link from "next/link";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/metric-card";
import { requireUser } from "@/lib/security/auth";
import { getVendorContext, getDashboardMetrics } from "@/lib/data/vendor";
import { 
  Car, BarChart3, MessageSquare, TrendingUp, 
  GitBranch, CreditCard, ArrowRight, Bell,
  CheckCircle, Clock, XCircle, Zap
} from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

import { Suspense } from "react";

// ... existing imports ...

// New Component for the async data
async function DashboardContent({ organization, userId }: { organization: any, userId: string }) {
  const metrics = await getDashboardMetrics(organization.id, userId);

  const isApproved = organization.status === "approved";
  const hasActiveSubscription = metrics.planCode !== null;

  const quickActions = [
    { label: "Add Vehicle", href: hasActiveSubscription ? "/vendor/vehicles" : "/vendor/billing", icon: Car, color: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
    { label: "View Leads", href: "/vendor/leads", icon: MessageSquare, color: "text-blue-600 bg-blue-50 hover:bg-blue-100", badge: metrics.newLeads > 0 ? metrics.newLeads : undefined },
    { label: "Manage Branches", href: "/vendor/branches", icon: GitBranch, color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" },
    { label: "Analytics", href: "/vendor/analytics", icon: BarChart3, color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
    { label: "Billing", href: "/vendor/billing", icon: CreditCard, color: "text-slate-600 bg-slate-50 hover:bg-slate-100" },
  ];

  return (
    <div className="space-y-6">
      {/* High-Converting Upsell Banner */}
      {!hasActiveSubscription && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-[#ea580c] to-amber-500 p-8 shadow-lg shadow-orange-500/20">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl text-white">
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Ready to start receiving leads?</h2>
              <p className="mt-2 text-orange-50 font-medium text-lg">
                Start your 14-day free trial today to list your fleet and get connected with verified customers across Australia.
              </p>
            </div>
            <Link
              href="/vendor/billing"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-orange-600 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:bg-orange-50"
            >
              <Zap className="h-5 w-5 text-amber-500 transition-transform group-hover:scale-110" fill="currentColor" />
              Start Free Trial
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{organization.name}</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isApproved
                  ? "bg-emerald-100 text-emerald-700"
                  : organization.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
              }`}>
                {isApproved ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {organization.status === "approved" ? "Approved" : organization.status === "pending" ? "Pending" : organization.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Manage your fleet, track leads, and grow your rental business.
            </p>
          </div>
        </div>

        {!isApproved && (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <Bell className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              Your organization is pending admin approval. You will be able to list vehicles once approved.
            </p>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active Listings"
          value={String(metrics.activeListings)}
          helper={metrics.pendingListings > 0 ? `${metrics.pendingListings} pending approval` : "Live & searchable"}
          icon="car"
          accent="emerald"
        />
        <Link href="/vendor/leads" className="block group">
          <div className={`h-full transition-all rounded-2xl ${metrics.newLeads > 0 ? "ring-2 ring-blue-500/50" : ""}`}>
            <MetricCard
              label="New Leads"
              value={String(metrics.newLeads)}
              helper={metrics.newLeads > 0 ? "Awaiting your response" : "No new enquiries"}
              icon="leads"
              accent="blue"
            />
          </div>
        </Link>
        <MetricCard
          label="Listing Views"
          value={String(metrics.totalViews)}
          helper="All-time vehicle page views"
          icon="eye"
          accent="amber"
        />
        <MetricCard
          label="Contact Clicks"
          value={String(metrics.clickStats.total)}
          helper="Phone & WhatsApp (30d)"
          icon="phone"
          accent="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map(({ label, href, icon: Icon, color, badge }) => (
            <Link
              key={label}
              href={href}
              className={`relative flex flex-col items-center gap-2 rounded-xl px-4 py-4 text-sm font-medium transition-all ${color}`}
            >
              {badge !== undefined && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {badge}
                </span>
              )}
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fleet Overview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">Fleet Overview</h2>
            <Link href="/vendor/vehicles" className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { label: "Active Listings", value: metrics.activeListings, color: "bg-emerald-500", textColor: "text-emerald-700" },
              { label: "Pending Approval", value: metrics.pendingListings, color: "bg-amber-400", textColor: "text-amber-700" },
              { label: "Total Vehicles", value: metrics.vehicleCount, color: "bg-slate-400", textColor: "text-slate-700" },
            ].map(({ label, value, color, textColor }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-600">{label}</span>
                  <span className={`font-semibold ${textColor}`}>{value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${color} transition-all duration-500`}
                    style={{ width: metrics.vehicleCount > 0 ? `${(value / metrics.vehicleCount) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Plan Limit</span>
                <span className="font-semibold text-slate-700">{metrics.planUsage}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-950 transition-all duration-500"
                  style={{
                    width: `${metrics.planLimit ? Math.min((metrics.vehicleCount / metrics.planLimit) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
            <Link href="/vendor/analytics" className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
              Full analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {metrics.newLeads > 0 && (
              <div className="flex items-center gap-4 rounded-xl bg-blue-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {metrics.newLeads} new lead{metrics.newLeads !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-slate-500">Waiting for your response</p>
                </div>
                <Link href="/vendor/leads" className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap">
                  View →
                </Link>
              </div>
            )}
            {metrics.clickStats.phone > 0 && (
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{metrics.clickStats.phone} phone calls</p>
                  <p className="text-xs text-slate-500">{metrics.clickStats.whatsapp} WhatsApp messages · Last 30 days</p>
                </div>
              </div>
            )}
            {metrics.newLeads === 0 && metrics.clickStats.total === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-3">
                  <BarChart3 className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">No activity yet</p>
                <p className="text-xs text-slate-400 mt-1">Activity will appear here when customers interact with your listings.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-[100px] rounded-2xl bg-slate-200"></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[120px] rounded-2xl bg-slate-200"></div>
        ))}
      </div>
      <div className="h-[200px] rounded-2xl bg-slate-200"></div>
    </div>
  );
}

export default async function VendorDashboardPage() {
  const user = await requireUser();
  const context = await getVendorContext(user.id);

  if (context.setupError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
          <XCircle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-lg font-semibold text-red-800">Setup Required</h1>
        <p className="mt-2 text-red-700 text-sm">{context.setupError}</p>
      </div>
    );
  }

  if (context.organizations.length === 0) {
    redirect("/vendor/upgrade");
  }

  const organization = context.organizations[0];

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent organization={organization} userId={user.id} />
    </Suspense>
  );
}

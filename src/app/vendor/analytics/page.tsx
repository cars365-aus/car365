import { redirect } from "next/navigation";
import { MetricCard } from "@/components/metric-card";
import { requireUser } from "@/lib/security/auth";
import { getVendorContext, getDashboardMetrics } from "@/lib/data/vendor";
import { organizationHasFeature } from "@/lib/plan-features";
import Link from "next/link";
import { Eye, Phone, MessageCircle, Lightbulb, Car, CheckCircle, Clock } from "lucide-react";

export const metadata = {
  title: "Analytics",
};

export default async function VendorAnalyticsPage() {
  const user = await requireUser();
  const context = await getVendorContext(user.id);

  if (context.setupError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-800">Setup Required</h1>
        <p className="mt-2 text-red-700">{context.setupError}</p>
      </div>
    );
  }

  if (context.organizations.length === 0) {
    redirect("/vendor/upgrade");
  }

  const organization = context.organizations[0];
  const hasAnalytics = await organizationHasFeature(organization.id, "contactAnalytics");

  if (!hasAnalytics) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-lg font-bold text-amber-900">Analytics requires Growth or Pro</h1>
        <p className="mt-2 text-sm text-amber-800">
          Upgrade your plan to unlock phone/WhatsApp click tracking and performance insights.
        </p>
        <Link
          href="/vendor/billing"
          className="mt-4 inline-flex rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
        >
          View plans
        </Link>
      </div>
    );
  }

  const metrics = await getDashboardMetrics(organization.id, user.id);

  const leadConversionRate = metrics.totalLeads > 0
    ? Math.round((metrics.clickStats.total / metrics.totalLeads) * 100)
    : 0;

  const phonePercent = metrics.clickStats.total > 0
    ? Math.round((metrics.clickStats.phone / metrics.clickStats.total) * 100)
    : 0;
  const waPercent = metrics.clickStats.total > 0
    ? Math.round((metrics.clickStats.whatsapp / metrics.clickStats.total) * 100)
    : 0;

  const planUsagePercent = metrics.planLimit
    ? Math.min(Math.round((metrics.vehicleCount / metrics.planLimit) * 100), 100)
    : 0;

  const tips = [
    "Add high-quality photos to every vehicle listing — listings with 3+ photos get 2× more clicks.",
    "Respond to leads within 1 hour to increase conversion rates significantly.",
    "Keep your fleet information and pricing up to date to appear in more searches.",
    "Adding branches in popular pickup locations increases your visibility.",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Listing performance, leads, and engagement for <span className="font-medium text-slate-700">{organization.name}</span>.
        </p>
      </div>

      {/* Top Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Listing Views"
          value={String(metrics.totalViews)}
          helper="All-time total views"
          icon="eye"
          accent="amber"
        />
        <MetricCard
          label="Phone Clicks"
          value={String(metrics.clickStats.phone)}
          helper="Calls initiated · last 30 days"
          icon="phone"
          accent="blue"
        />
        <MetricCard
          label="WhatsApp Clicks"
          value={String(metrics.clickStats.whatsapp)}
          helper="Messages initiated · last 30 days"
          icon="chat"
          accent="green"
        />
      </div>

      {/* Lead & Fleet row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Overview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Lead Overview</h2>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-3xl font-bold text-slate-900">{metrics.totalLeads}</p>
              <p className="text-xs text-slate-500 mt-1">Total Leads</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">{metrics.newLeads}</p>
              <p className="text-xs text-blue-500 mt-1">Awaiting Reply</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Lead-to-contact rate</span>
              <span className={`font-semibold ${leadConversionRate > 30 ? "text-emerald-600" : "text-slate-900"}`}>
                {leadConversionRate}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                style={{ width: `${Math.min(leadConversionRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {leadConversionRate === 0 ? "Start receiving leads by adding vehicles to your fleet." : `${leadConversionRate}% of your leads led to contact.`}
            </p>
          </div>
        </div>

        {/* Fleet Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Fleet Status</h2>
          <div className="space-y-4">
            {[
              { label: "Active Listings", value: metrics.activeListings, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100", bar: "bg-emerald-500" },
              { label: "Pending Approval", value: metrics.pendingListings, icon: Clock, color: "text-amber-600", bg: "bg-amber-100", bar: "bg-amber-400" },
              { label: "Total Vehicles", value: metrics.vehicleCount, icon: Car, color: "text-slate-600", bg: "bg-slate-100", bar: "bg-slate-400" },
            ].map(({ label, value, icon: Icon, color, bg, bar }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className={`h-1.5 rounded-full ${bar}`}
                      style={{ width: metrics.vehicleCount > 0 ? `${(value / metrics.vehicleCount) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-600">Plan Usage</span>
                <span className="font-semibold text-slate-900">{metrics.planUsage}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${planUsagePercent > 85 ? "bg-red-500" : "bg-slate-950"}`}
                  style={{ width: `${planUsagePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{planUsagePercent}% of plan limit used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Channel Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-5">
          Contact Channel Performance
          <span className="ml-2 text-xs font-normal text-slate-400">Last 30 days</span>
        </h2>
        {metrics.clickStats.total > 0 ? (
          <div className="space-y-5">
            {/* Phone */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-slate-700">Phone Calls</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-900 font-semibold">{metrics.clickStats.phone}</span>
                  <span className="text-xs text-slate-400 w-10 text-right">{phonePercent}%</span>
                </div>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700"
                  style={{ width: `${phonePercent}%` }}
                />
              </div>
            </div>
            {/* WhatsApp */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-slate-700">WhatsApp Messages</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-900 font-semibold">{metrics.clickStats.whatsapp}</span>
                  <span className="text-xs text-slate-400 w-10 text-right">{waPercent}%</span>
                </div>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700"
                  style={{ width: `${waPercent}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400">{metrics.clickStats.total} total contact events tracked</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-3">
              <Eye className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No contact activity yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Once customers click your phone or WhatsApp buttons, you will see a breakdown here.
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
            <Lightbulb className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="font-semibold text-amber-800">Tips to Improve Performance</h3>
        </div>
        <ul className="space-y-2.5">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-700">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

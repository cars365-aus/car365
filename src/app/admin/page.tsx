import Link from "next/link";
import { 
  Users, 
  Car, 
  ShieldAlert, 
  Star, 
  TrendingUp, 
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react";
import {
  getAdminDashboardMetrics,
  getPendingVendors,
  getPendingListings,
  getOpenFraudFlags,
  getPendingReviews,
  getHistoricalAnalytics,
} from "@/lib/data/admin";
import { requireAdmin } from "@/lib/security/auth";
import { AnalyticsChart } from "@/components/admin/analytics-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Admin Control Room",
};

import { Suspense } from "react";

// ... existing imports ...

async function AdminDashboardContent() {
  const [metrics, pendingVendors, pendingListings, fraudFlags, pendingReviews, analytics] = await Promise.all(
    [
      getAdminDashboardMetrics(),
      getPendingVendors(5),
      getPendingListings(5),
      getOpenFraudFlags(5),
      getPendingReviews(5),
      getHistoricalAnalytics(),
    ],
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/50 pb-6 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg shadow-orange-500/20">
              <Activity className="h-6 w-6 text-white" />
            </div>
            Global Control Room
          </h1>
          <p className="mt-3 text-slate-500 max-w-2xl font-medium">
            Real-time monitoring of platform health, vendor moderation queues, and financial metrics.
          </p>
        </div>
        <Card className="min-w-[200px] glass-panel rounded-2xl border-white/40 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="text-right p-5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Est. Annual Run Rate</div>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400 flex items-center justify-end gap-2 drop-shadow-sm">
              ${metrics.revenueEstimate.toLocaleString()}
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[400px]">
            <AnalyticsChart 
              title="Revenue Growth (YTD)" 
              data={analytics.revenueData} 
              valuePrefix="$" 
              color="emerald" 
            />
          </div>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[400px]">
            <AnalyticsChart 
              title="Lead Volume (Last 7 Days)" 
              data={analytics.leadsData} 
              color="amber" 
            />
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard 
          icon={Users} 
          label="Pending Vendors" 
          value={metrics.pendingVendors} 
          total={metrics.totalVendors}
          trend="+12% this week"
          color="blue"
          href="/admin/vendors"
        />
        <MetricCard 
          icon={Car} 
          label="Pending Listings" 
          value={metrics.pendingListings} 
          total={metrics.totalListings}
          trend="+5% this week"
          color="emerald"
          href="/admin/listings"
        />
        <MetricCard 
          icon={ShieldAlert} 
          label="Open Fraud Flags" 
          value={metrics.openFraudFlags} 
          total={metrics.totalFraudFlags}
          trend={metrics.newFraudFlagsToday > 0 ? `${metrics.newFraudFlagsToday} new today` : "All clear"}
          color="red"
          href="/admin/fraud"
        />
        <MetricCard 
          icon={Star} 
          label="Pending Reviews" 
          value={metrics.pendingReviews} 
          total={metrics.totalReviews}
          trend="Requires moderation"
          color="amber"
          href="/admin/reviews"
        />
      </div>

      {/* Actionable Queues */}
      <div className="grid gap-6 lg:grid-cols-2 mt-8">
        
        {/* Pending Vendors Queue */}
        <Card className="glass-panel rounded-3xl border-white/40 shadow-xl overflow-hidden flex flex-col">
          <CardHeader className="bg-white/40 border-b border-slate-100/50 backdrop-blur-md">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="h-4 w-4" />
                </div>
                Vendor Approval Queue
              </CardTitle>
              <Link href="/admin/vendors" className="text-xs font-bold uppercase tracking-wider text-primary hover:text-orange-500 transition-colors bg-orange-50/50 hover:bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                View All ({metrics.pendingVendors})
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 bg-slate-50/20">
            {pendingVendors.length === 0 ? (
              <EmptyState message="No vendors waiting for approval" />
            ) : (
              <div className="space-y-3">
                {pendingVendors.map((vendor) => (
                  <div key={vendor.id} className="group flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/60 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-white hover:shadow-md">
                    <div>
                      <div className="font-bold text-slate-900">{vendor.name}</div>
                      <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">ABN: {vendor.abn}</span>
                        <span>•</span>
                        <span>{vendor.branchCount} locations</span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <Link href={`/admin/vendors?status=pending&review=${vendor.id}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm" title="Review vendor">
                        <CheckCircle2 className="h-5 w-5" />
                      </Link>
                      <Link href={`/admin/vendors?status=pending`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors shadow-sm" title="Go to vendor moderation">
                        <XCircle className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Listings */}
        <Card className="glass-panel rounded-3xl border-white/40 shadow-xl overflow-hidden flex flex-col">
          <CardHeader className="bg-white/40 border-b border-slate-100/50 backdrop-blur-md">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Car className="h-4 w-4" />
                </div>
                Pending Listings
              </CardTitle>
              <Link href="/admin/listings?status=pending" className="text-xs font-bold uppercase tracking-wider text-primary hover:text-orange-500 transition-colors bg-orange-50/50 hover:bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                View All ({pendingListings.length})
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 bg-slate-50/20">
            {pendingListings.length === 0 ? (
              <EmptyState message="No listings awaiting approval." icon={CheckCircle2} iconColor="text-emerald-500" />
            ) : (
              <div className="space-y-3">
                {pendingListings.map((listing) => (
                  <Link key={listing.id} href="/admin/listings?status=pending" className="block rounded-2xl border border-slate-200/60 bg-white/60 p-4 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                    <div className="font-bold text-slate-900">{listing.title}</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">{listing.vendorName}</div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card className="glass-panel rounded-3xl border-white/40 shadow-xl overflow-hidden flex flex-col">
          <CardHeader className="bg-white/40 border-b border-slate-100/50 backdrop-blur-md">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Star className="h-4 w-4" />
                </div>
                Pending Reviews
              </CardTitle>
              <Link href="/admin/reviews" className="text-xs font-bold uppercase tracking-wider text-primary hover:text-orange-500 transition-colors bg-orange-50/50 hover:bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                View All ({pendingReviews.length})
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 bg-slate-50/20">
            {pendingReviews.length === 0 ? (
              <EmptyState message="No reviews awaiting moderation." icon={CheckCircle2} iconColor="text-emerald-500" />
            ) : (
              <div className="space-y-3">
                {pendingReviews.map((review) => (
                  <Link key={review.id} href="/admin/reviews" className="block rounded-2xl border border-slate-200/60 bg-white/60 p-4 transition-all duration-300 hover:border-amber-500/30 hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-slate-900">{review.customerName}</div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold">{review.rating} / 5</Badge>
                    </div>
                    <div className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed">{review.body}</div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fraud Flags Queue */}
        <Card className="glass-panel rounded-3xl border-white/40 shadow-xl overflow-hidden flex flex-col">
          <CardHeader className="bg-red-50/50 border-b border-red-100/50 backdrop-blur-md">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <div className="p-1.5 bg-red-100 text-red-600 rounded-lg shadow-sm shadow-red-200/50">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                Active Fraud Flags
              </CardTitle>
              <Link href="/admin/fraud" className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors bg-red-100/50 hover:bg-red-100 px-3 py-1.5 rounded-full border border-red-200">
                View All ({fraudFlags.length})
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 bg-slate-50/20">
            {fraudFlags.length === 0 ? (
              <EmptyState message="System secure. No active fraud flags." icon={CheckCircle2} iconColor="text-emerald-500" />
            ) : (
              <div className="space-y-3">
                {fraudFlags.map((flag) => (
                  <div key={flag.id} className="flex items-start justify-between rounded-2xl border border-slate-200/60 bg-white/60 p-4 relative overflow-hidden transition-all duration-300 hover:border-red-500/30 hover:bg-white hover:shadow-md group">
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      flag.severity === "critical" ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" :
                      flag.severity === "high" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "bg-amber-400"
                    }`} />
                    <div className="pl-3">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        {flag.reason}
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider text-[10px]">{flag.resourceType}</span>
                        <span>•</span>
                        <span className="line-clamp-1">{flag.vendorName || flag.vehicleTitle}</span>
                      </div>
                    </div>
                    <Link href={`/admin/fraud?id=${flag.id}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all transform group-hover:scale-105">
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-32 bg-slate-200 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 bg-slate-200 rounded-3xl" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-slate-200 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requireAdmin();

  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MetricCard({ icon: Icon, label, value, total, trend, color, href }: any) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string; glow: string }> = {
    blue: { bg: "bg-blue-50/50 border-blue-200/50", text: "text-blue-600", iconBg: "bg-blue-100", glow: "from-blue-500/10 to-transparent" },
    emerald: { bg: "bg-emerald-50/50 border-emerald-200/50", text: "text-emerald-600", iconBg: "bg-emerald-100", glow: "from-emerald-500/10 to-transparent" },
    red: { bg: "bg-red-50/50 border-red-200/50", text: "text-red-600", iconBg: "bg-red-100", glow: "from-red-500/10 to-transparent" },
    amber: { bg: "bg-amber-50/50 border-amber-200/50", text: "text-amber-600", iconBg: "bg-amber-100", glow: "from-amber-500/10 to-transparent" },
  };

  const theme = colorMap[color];

  return (
    <Link href={href} className={`group relative overflow-hidden rounded-3xl border glass-panel card-lift p-6 ${theme.bg}`}>
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${theme.glow} rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150`} />
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.iconBg} ${theme.text} shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-4xl font-black text-slate-800 drop-shadow-sm">{value}</div>
      </div>
      <div className="relative z-10 text-sm font-bold text-slate-600 uppercase tracking-wider">{label}</div>
      <div className="relative z-10 mt-3 flex items-center justify-between text-xs font-medium">
        <span className="text-slate-400 bg-white/60 px-2 py-1 rounded-md">{total} Total</span>
        <span className={`px-2 py-1 rounded-md font-bold ${color === 'red' && value > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {trend}
        </span>
      </div>
    </Link>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EmptyState({ message, icon: Icon = ShieldAlert, iconColor = "text-muted-foreground" }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className={`h-12 w-12 mb-3 opacity-50 ${iconColor}`} />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/security/auth";
import { getVendorContext } from "@/lib/data/vendor";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateOrganizationProfile, uploadVendorDocument } from "./actions";
import { BrandForm } from "./brand-form";
import { ProfileForm } from "./profile-form";
import { getOrganizationPlanCode, getSupportTierLabel, organizationHasFeature } from "@/lib/plan-features";
import { ApiKeysPanel } from "@/components/vendor/api-keys-panel";
import {
  Building2, Users, Phone, Globe, MapPin, Shield,
  CheckCircle, Clock, Hash, Mail, Image as ImageIcon, FileText, Bell, UserPlus, Info
} from "lucide-react";

export const metadata = {
  title: "Settings",
};

export default async function VendorSettingsPage() {
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
  const supabase = createAdminClient();

  // Fetch full org details
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, abn, billing_email, website, phone, address, status, verified_at, created_at")
    .eq("id", organization.id)
    .single();

  // Fetch team members
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, role, created_at, profiles(full_name, email)")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: true });

  const isApproved = org?.status === "approved";
  const planCode = await getOrganizationPlanCode(organization.id);
  const supportTier = getSupportTierLabel(planCode);
  const hasApiAccess = await organizationHasFeature(organization.id, "apiAccess");

  const { data: apiKeys } = await supabase
    .from("api_keys")
    .select("id, label, key_prefix, created_at, last_used_at, revoked")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });

  const { data: documents } = await supabase
    .from("vendor_documents")
    .select("id, document_type, status, created_at")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });

  const ROLE_LABELS: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    manager: "Manager",
    staff: "Staff",
  };

  const ROLE_COLORS: Record<string, string> = {
    owner: "bg-slate-950 text-white",
    admin: "bg-blue-100 text-blue-700",
    manager: "bg-amber-100 text-amber-700",
    staff: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your organization profile and team for{" "}
              <span className="font-medium text-slate-700">{org?.name}</span>
            </p>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Support tier: {supportTier}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              isApproved
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-amber-100 text-amber-700 border-amber-200"
            }`}
          >
            {isApproved ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {isApproved ? "Approved" : "Pending approval"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization Profile */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <Building2 className="h-4.5 w-4.5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Organization Details</h2>
              <p className="text-xs text-slate-400">Internal information & contact</p>
            </div>
          </div>

          <ProfileForm
            organizationId={organization.id}
            defaultValues={{
              name: org?.name ?? "",
              phone: org?.phone ?? "",
              website: org?.website ?? "",
              address: org?.address ?? "",
            }}
          />
        </div>

        {/* Public Profile & Brand */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
              <ImageIcon className="h-4.5 w-4.5 text-[#ea580c]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Public Profile</h2>
              <p className="text-xs text-slate-400">Customize how customers see you</p>
            </div>
          </div>

          <BrandForm 
            organizationId={org!.id} 
            defaultBio={(org as any)?.bio} 
            defaultLogoUrl={(org as any)?.logo_url} 
          />
        </div>

        {/* Global Policies */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <FileText className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Global Policies</h2>
              <p className="text-xs text-slate-400">Standard rules appended to all vehicles</p>
            </div>
          </div>

          <form className="space-y-5">
            <div>
              <label htmlFor="cancellation-policy" className="block text-sm font-medium text-foreground mb-1.5">Cancellation Policy</label>
              <textarea
                id="cancellation-policy"
                rows={2}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all resize-none"
                placeholder="e.g., Free cancellation up to 48 hours before pickup."
                aria-describedby="cancel-helper"
              />
              <p id="cancel-helper" className="mt-1.5 text-xs text-muted-foreground">Shown on all your vehicle listings</p>
            </div>

            <div>
              <label htmlFor="deposit-rules" className="block text-sm font-medium text-foreground mb-1.5">Security Deposit Rules</label>
              <textarea
                id="deposit-rules"
                rows={2}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all resize-none"
                placeholder="e.g., A $500 pre-authorization is required at the counter."
                aria-describedby="deposit-helper"
              />
              <p id="deposit-helper" className="mt-1.5 text-xs text-muted-foreground">Shown on all your vehicle listings</p>
            </div>
            
            <button type="button" className="w-full rounded-xl bg-card border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm">
              Save Policies
            </button>
          </form>
        </div>

        {/* Read-only Info */}
        <div className="space-y-4">
          {/* Identity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                <Shield className="h-4.5 w-4.5 text-slate-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Business Identity</h2>
                <p className="text-xs text-slate-400">Verified at onboarding — contact support to update</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                  <Hash className="inline h-3 w-3 mr-1" />
                  ABN
                </p>
                <p className="font-mono text-sm font-semibold text-slate-800 bg-slate-50 rounded-lg px-3 py-2">
                  {org?.abn
                    ? `${org.abn.slice(0, 2)} ${org.abn.slice(2, 5)} ${org.abn.slice(5, 8)} ${org.abn.slice(8)}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                  <Mail className="inline h-3 w-3 mr-1" />
                  Billing Email
                </p>
                <p className="text-sm text-slate-800 bg-slate-50 rounded-lg px-3 py-2">
                  {org?.billing_email ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Slug</p>
                <p className="font-mono text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                  /vendors/{org?.slug}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Member Since</p>
                <p className="text-sm text-slate-700">
                  {org?.created_at
                    ? new Date(org.created_at).toLocaleDateString("en-AU", {
                        day: "numeric", month: "long", year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Quick Links</p>
            <div className="space-y-2">
              {[
                { label: "Manage Branches", href: "/vendor/branches" },
                { label: "Billing & Subscription", href: "/vendor/billing" },
                { label: "View public profile", href: `/vendors/${org?.slug}` },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {label}
                  <span className="text-slate-400">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Lead Notification Preferences */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                <Bell className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Lead Notifications</h2>
                <p className="text-xs text-slate-400">Speed-to-lead settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">New Inquiry SMS</p>
                  <p className="text-xs text-slate-500 font-medium">Instantly text me when a customer submits a lead.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">Daily Digest Email</p>
                  <p className="text-xs text-slate-500 font-medium">Send a summary of all leads at 5:00 PM.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
            <Users className="h-4.5 w-4.5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Team Members</h2>
            <p className="text-xs text-slate-400">{members?.length ?? 0} member{members?.length !== 1 ? "s" : ""} with access</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {members?.map((member) => {
            type ProfileRecord = { full_name: string | null; email: string | null };
            const profile = member.profiles as unknown as ProfileRecord | null;
            const name = profile?.full_name || "Unknown";
            const email = profile?.email || "";
            const initials = name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div key={member.user_id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{name}</p>
                  <p className="text-xs text-slate-400 truncate">{email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[member.role] ?? "bg-slate-100 text-slate-600"}`}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(member.created_at).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" /> Need custom roles? Contact support.
          </p>
          <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ea580c] hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg transition-colors">
            <UserPlus className="h-4 w-4" /> Invite Member
          </button>
        </div>
      </div>

      <ApiKeysPanel
        organizationId={organization.id}
        keys={apiKeys ?? []}
        hasAccess={hasApiAccess}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Business documents</h2>
        <p className="text-sm text-slate-500 mb-4">
          Upload ABN certificate, insurance, or GPS proof for admin verification.
        </p>
        <form action={uploadVendorDocument} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="hidden" name="organizationId" value={organization.id} />
          <select name="documentType" className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="abn_certificate">ABN certificate</option>
            <option value="insurance">Insurance</option>
            <option value="gps_proof">GPS proof</option>
          </select>
          <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" required className="text-sm" />
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Upload
          </button>
        </form>
        {documents && documents.length > 0 && (
          <ul className="space-y-2 text-sm">
            {documents.map((doc) => (
              <li key={doc.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium capitalize">{doc.document_type.replace("_", " ")}</span>
                <span className="text-slate-500">{doc.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

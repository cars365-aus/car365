"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerProfile, deleteCustomerAccount } from "@/app/actions/customer";
import { updateNotificationPrefs } from "./actions";
import { User, Phone, Mail, AlertTriangle, Save, Loader2, Bell, Heart, MessageSquare } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function CustomerSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState({
    inquiryUpdates: true,
    specialOffers: false,
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, email, notification_prefs")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setFormData({
          fullName: profile.full_name || "",
          phone: profile.phone || "",
          email: profile.email || session.user.email || "",
        });
        const prefs = profile.notification_prefs as { inquiryUpdates?: boolean; specialOffers?: boolean } | null;
        if (prefs) {
          setNotificationPrefs({
            inquiryUpdates: prefs.inquiryUpdates ?? true,
            specialOffers: prefs.specialOffers ?? false,
          });
        }
      }
      setIsLoading(false);
    }
    
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const data = new FormData();
    data.append("fullName", formData.fullName);
    data.append("phone", formData.phone);

    const result = await updateCustomerProfile(data);
    
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully." });
    }
    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") {
      setMessage({ type: "error", text: "Please type DELETE to confirm." });
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    const result = await deleteCustomerAccount(deleteText);
    
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      setIsDeleting(false);
    } else {
      // Successfully deleted on server, sign out locally
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      await supabase.auth.signOut();
      router.push("/?deleted=true");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 sm:p-10 flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 bg-slate-50/50 min-h-full">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="mt-2 text-slate-500 font-medium">Manage your personal information and account security.</p>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      <div className="max-w-2xl space-y-10">
        {/* Profile Information */}
        <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Information</h2>
          
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all font-medium"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all font-medium"
                    placeholder="+61 400 000 000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  disabled
                  value={formData.email}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Email addresses cannot be changed currently.</p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save Changes
              </button>
            </div>
          </form>
        </section>

        {/* Notifications & Preferences */}
        <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <Bell className="h-5 w-5 text-[#ea580c]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Notification Preferences</h2>
              <p className="text-sm text-slate-500 font-medium">Control how we communicate with you.</p>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingPrefs(true);
              setMessage(null);
              const data = new FormData();
              if (notificationPrefs.inquiryUpdates) data.append("inquiryUpdates", "on");
              if (notificationPrefs.specialOffers) data.append("specialOffers", "on");
              const result = await updateNotificationPrefs(data);
              if (result.error) {
                setMessage({ type: "error", text: result.error });
              } else {
                setMessage({ type: "success", text: "Notification preferences saved." });
              }
              setIsSavingPrefs(false);
            }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-slate-600 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Inquiry Updates</p>
                  <p className="text-sm text-slate-500 font-medium">Get notified immediately when a vendor replies to you.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationPrefs.inquiryUpdates}
                  onChange={(e) => setNotificationPrefs((p) => ({ ...p, inquiryUpdates: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ea580c]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-slate-600 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Special Offers & Deals</p>
                  <p className="text-sm text-slate-500 font-medium">Receive discounts from our top-rated local vendors.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationPrefs.specialOffers}
                  onChange={(e) => setNotificationPrefs((p) => ({ ...p, specialOffers: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ea580c]"></div>
              </label>
            </div>
            <button
              type="submit"
              disabled={isSavingPrefs}
              className="rounded-xl bg-[#ea580c] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {isSavingPrefs ? "Saving…" : "Save preferences"}
            </button>
          </form>
        </section>

        {/* Danger Zone */}
        <section className="mt-12 pt-12 border-t border-slate-200">
          <details className="group">
            <summary className="flex items-center gap-2 text-red-600 font-bold cursor-pointer hover:text-red-700 transition-colors list-none">
              <AlertTriangle className="h-5 w-5" />
              Advanced Security & Deletion
            </summary>
            
            <div className="mt-6 bg-white rounded-2xl border border-red-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Account</h2>
              <p className="text-sm text-slate-500 font-medium mb-6">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm"
                >
                  Delete Account
                </button>
              ) : (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <p className="text-sm font-bold text-slate-900">
                    To confirm deletion, please type <span className="text-red-600 select-all">DELETE</span> below:
                  </p>
                  <input
                    type="text"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none font-medium"
                    placeholder="Type DELETE"
                  />
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteText !== "DELETE" || isDeleting}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Deletion"}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteText("");
                      }}
                      className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}

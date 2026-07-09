import { getSupportConfig, type SupportChannel } from "@/lib/support-channels";
import { Mail, Phone, UserCircle, Zap } from "lucide-react";

interface SupportRouterProps {
  planCode: string | null | undefined;
  subscriptionStatus?: string;
}

const CHANNEL_META: Record<
  SupportChannel,
  { icon: typeof Mail; title: string; description: string }
> = {
  email: {
    icon: Mail,
    title: "Email Support",
    description: "Send us an email and we'll respond within 48 hours.",
  },
  priorityEmail: {
    icon: Mail,
    title: "Priority Email",
    description: "Priority inbox — responses within 12 hours.",
  },
  phone: {
    icon: Phone,
    title: "Phone Support",
    description: "Call our support line during business hours.",
  },
  dedicatedPhone: {
    icon: Phone,
    title: "Dedicated Phone Line",
    description: "Your own direct line to our senior support team.",
  },
  accountManager: {
    icon: UserCircle,
    title: "Account Manager",
    description: "A dedicated account manager assigned to your business.",
  },
  sameDayResponse: {
    icon: Zap,
    title: "Same-Day Response",
    description: "All inquiries receive a response the same business day.",
  },
};

function SupportChannelCard({ channel }: { channel: SupportChannel }) {
  const meta = CHANNEL_META[channel];
  const Icon = meta.icon;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4.5 w-4.5 text-slate-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{meta.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{meta.description}</p>
      </div>
    </div>
  );
}

export function SupportRouter({ planCode, subscriptionStatus }: SupportRouterProps) {
  const config = getSupportConfig(planCode, subscriptionStatus);

  return (
    <div className="space-y-3">
      {config.channels.map((channel) => (
        <SupportChannelCard key={channel} channel={channel} />
      ))}
    </div>
  );
}

import { transporter } from "@/lib/email/ses";
import { createAdminClient } from "@/lib/supabase/admin";
import { optionalEnv } from "@/lib/config";
import type { LeadType } from "@/lib/domain";

const FROM = optionalEnv("EMAIL_FROM") || "Cars365 <noreply@cars365.example>";

const TYPE_LABEL: Record<LeadType, string> = {
  vehicle_enquiry: "Vehicle enquiry",
  inspection: "Inspection request",
  finance: "Finance enquiry",
  trade_in: "Trade-in enquiry",
  sell: "Sell your car",
  callback: "Callback request",
  general: "General enquiry",
  waitlist: "Waitlist / notify me",
};

async function notificationRecipients(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "notification_recipients").maybeSingle();
  const emails = (data?.value as { emails?: string[] } | null)?.emails;
  const list = Array.isArray(emails) ? emails.filter(Boolean) : [];
  const fallback = optionalEnv("CONTACT_EMAIL_TO");
  return list.length > 0 ? list : fallback ? [fallback] : [];
}

/**
 * Instant sales notification for a new lead (SRS §14.3). Best-effort: returns
 * `{ sent }` and never throws so a mail failure can't lose an already-persisted
 * lead. The route logs a 'notified' event on success.
 */
export async function notifyNewLead(input: {
  type: LeadType;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  vehicleTitle?: string | null;
  sourceUrl?: string | null;
}): Promise<{ sent: boolean }> {
  if (!transporter) return { sent: false };
  const to = await notificationRecipients();
  if (to.length === 0) return { sent: false };

  const label = TYPE_LABEL[input.type] ?? "New lead";
  const subject = input.vehicleTitle
    ? `New ${label.toLowerCase()}: ${input.vehicleTitle}`
    : `New ${label.toLowerCase()} from ${input.name}`;

  const lines = [
    `${label}`,
    ``,
    `Name:  ${input.name}`,
    `Phone: ${input.phone}`,
    input.email ? `Email: ${input.email}` : null,
    input.vehicleTitle ? `Vehicle: ${input.vehicleTitle}` : null,
    input.message ? `\nMessage:\n${input.message}` : null,
    input.sourceUrl ? `\nSource: ${input.sourceUrl}` : null,
    ``,
    `Respond within 15 minutes for the best conversion (SLA).`,
  ].filter(Boolean);

  try {
    await transporter.sendMail({ from: FROM, to, subject, text: lines.join("\n") });
    return { sent: true };
  } catch {
    return { sent: false };
  }
}

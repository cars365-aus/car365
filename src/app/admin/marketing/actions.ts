"use server";

import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMarketingEmail } from "@/lib/email/ses";

export type MarketingEmailState = {
  status: "idle" | "success" | "error";
  message: string;
  details?: {
    sent: number;
    failed: number;
    skipped: number;
    recipientCount: number;
  };
};

type Recipient = {
  email: string;
  name: string;
};

const ADMIN_EMAIL = process.env.CONTACT_EMAIL_TO ?? "support@hirecarmarketplace.com.au";
const MAX_RECIPIENTS = 500;

function parseManualRecipients(raw: string): Recipient[] {
  return raw
    .split(/[\n,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .map((email) => ({ email, name: "there" }));
}

function dedupeRecipients(recipients: Recipient[]) {
  const seen = new Set<string>();
  return recipients.filter((recipient) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) return false;
    if (seen.has(recipient.email)) return false;
    seen.add(recipient.email);
    return true;
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function textToHtml(value: string) {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px;">${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

async function getAudienceRecipients(audience: string, manualRecipients: string) {
  const supabase = createAdminClient();

  if (audience === "manual") {
    return parseManualRecipients(manualRecipients);
  }

  if (audience === "admin") {
    return [{ email: ADMIN_EMAIL.toLowerCase(), name: "Admin" }];
  }

  if (audience === "vendors") {
    const { data, error } = await supabase
      .from("organizations")
      .select("name, billing_email")
      .not("billing_email", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_RECIPIENTS);

    if (error) throw new Error(`Could not load vendor recipients: ${error.message}`);

    return (data ?? []).map((org) => ({
      email: String(org.billing_email).trim().toLowerCase(),
      name: org.name || "there",
    }));
  }

  // "accounts" audience - fetch from auth.users via admin API for reliable emails
  // The profiles table may not have emails populated if users signed up without updating their profile.
  // Use supabase admin to list users from auth which always has email.
  if (audience === "accounts") {
    // Try to get from profiles first (most likely has full_name), falling back to auth
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .not("email", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_RECIPIENTS);

    if (profileError) throw new Error(`Could not load account recipients: ${profileError.message}`);

    const profileRecipients = (profileData ?? [])
      .filter((p) => p.email)
      .map((profile) => ({
        email: String(profile.email).trim().toLowerCase(),
        name: profile.full_name || "there",
      }));

    // If profiles have no emails, fall back to listing auth users
    if (profileRecipients.length === 0) {
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: MAX_RECIPIENTS,
      });
      if (usersError) throw new Error(`Could not load auth users: ${usersError.message}`);
      return (usersData?.users ?? [])
        .filter((u) => u.email)
        .map((u) => ({
          email: u.email!.trim().toLowerCase(),
          name: u.user_metadata?.full_name || u.email!.split("@")[0] || "there",
        }));
    }

    return profileRecipients;
  }

  throw new Error(`Unknown audience: ${audience}`);
}

export async function sendMarketingCampaign(
  _previousState: MarketingEmailState,
  formData: FormData,
): Promise<MarketingEmailState> {
  await requireAdmin();

  const audience = String(formData.get("audience") ?? "admin");
  const manualRecipients = String(formData.get("recipients") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const heading = String(formData.get("heading") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaUrl = String(formData.get("ctaUrl") ?? "").trim();

  if (subject.length < 4 || subject.length > 160) {
    return { status: "error", message: "Subject must be between 4 and 160 characters." };
  }

  if (heading.length < 4 || heading.length > 120) {
    return { status: "error", message: "Heading must be between 4 and 120 characters." };
  }

  if (body.length < 10 || body.length > 8000) {
    return { status: "error", message: "Body must be between 10 and 8000 characters." };
  }

  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    return { status: "error", message: "CTA label and URL must be provided together." };
  }

  if (ctaUrl && !/^https?:\/\/.+/i.test(ctaUrl)) {
    return { status: "error", message: "CTA URL must start with http:// or https://." };
  }

  try {
    const allRecipients = await getAudienceRecipients(audience, manualRecipients);
    const recipients = dedupeRecipients(allRecipients);

    if (recipients.length === 0) {
      return {
        status: "error",
        message: `No valid recipients found for audience "${audience}". ${
          audience === "manual"
            ? "Please enter at least one valid email address."
            : "No users found in the database."
        }`,
      };
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const bodyHtml = textToHtml(body);
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const result = await sendMarketingEmail({
          to: recipient.email,
          recipientName: recipient.name,
          subject,
          heading,
          bodyHtml,
          ctaLabel: ctaLabel || undefined,
          ctaUrl: ctaUrl || undefined,
        });

        if (result.skipped) skipped += 1;
        else sent += 1;
      } catch (error) {
        failed += 1;
        const errMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${recipient.email}: ${errMsg}`);
        console.error("[Marketing] Failed to send campaign email", {
          recipient: recipient.email,
          error,
        });
      }
    }

    // All skipped means the SMTP transporter is not configured
    if (sent === 0 && skipped > 0 && failed === 0) {
      return {
        status: "error",
        message:
          "Campaign was not sent — SMTP is not configured. Add SMTP_HOST, SMTP_USER and SMTP_PASS to your environment variables.",
        details: { sent, failed, skipped, recipientCount: recipients.length },
      };
    }

    const statusMsg =
      failed > 0
        ? `Campaign sent with ${failed} failure(s). Sent: ${sent}, Failed: ${failed}, Skipped: ${skipped}.${errors.length > 0 ? ` First error: ${errors[0]}` : ""}`
        : `Campaign sent successfully! Delivered to ${sent} recipient${sent !== 1 ? "s" : ""}${skipped > 0 ? `, ${skipped} skipped` : ""}.`;

    return {
      status: failed > 0 && sent === 0 ? "error" : "success",
      message: statusMsg,
      details: { sent, failed, skipped, recipientCount: recipients.length },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not send campaign.",
    };
  }
}

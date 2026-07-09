import nodemailer from "nodemailer";
import { getAppUrl, optionalEnv } from "@/lib/config";

const smtpHost = optionalEnv("SMTP_HOST");
const smtpPort = parseInt(optionalEnv("SMTP_PORT") || "465", 10);
const smtpUser = optionalEnv("SMTP_USER");
const smtpPass = optionalEnv("SMTP_PASS");

export const transporter = (smtpHost && smtpUser && smtpPass)
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

const FROM = process.env.EMAIL_FROM ?? "Hire Car Marketplace <noreply@hirecarmarketplace.com.au>";
const REPLY_TO = process.env.REPLY_TO_EMAIL ?? process.env.CONTACT_EMAIL_TO ?? "support@hirecarmarketplace.com.au";
const LOGO_HTML = `<img src="${getAppUrl()}/LOGO.png" alt="Hire Car Marketplace" style="height:40px;margin-bottom:24px;display:block;margin-left:auto;margin-right:auto;" />`;

export async function sendLeadAlert(input: {
  to: string;
  vehicleTitle: string;
  customerName: string;
}) {
  if (!transporter) return { skipped: true };
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `New rental lead for ${input.vehicleTitle}`,
    text: `${input.customerName} submitted a rental enquiry. Open the vendor dashboard to review and respond.`,
  });
  return { skipped: false };
}

export async function sendCustomerEnquiryConfirmation(input: {
  to: string;
  customerName: string;
  vehicleTitle: string;
  leadId: string;
}) {
  if (!transporter) return { skipped: true };
  const chatUrl = `${getAppUrl()}/messages/${input.leadId}`;
  const signInUrl = `${getAppUrl()}/auth/sign-in?redirectedFrom=${encodeURIComponent(chatUrl)}`;
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `Your enquiry for ${input.vehicleTitle}`,
    text: [`Hi ${input.customerName},`, "", `We've sent your rental enquiry for ${input.vehicleTitle} to the vendor.`, "", `Sign in to chat with the vendor:`, signInUrl, "", `Or open your conversation:`, chatUrl].join("\n"),
  });
  return { skipped: false };
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(input: {
  to: string;
  name: string;
  role?: "vendor" | "customer";
}) {
  if (!transporter) return { skipped: true };
  const isVendor = input.role === "vendor";
  const dashboardUrl = isVendor ? `${getAppUrl()}/vendor/dashboard` : `${getAppUrl()}/search`;
  const greeting = isVendor
    ? "Your vendor account is ready. Start adding your fleet and reach thousands of customers across Australia."
    : "You're all set to find your perfect rental car across Australia. Browse thousands of vehicles from verified local vendors.";
  const ctaLabel = isVendor ? "Go to Vendor Dashboard" : "Browse Cars";

  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: "Welcome to Hire Car Marketplace! \uD83D\uDE97",
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      ${LOGO_HTML}
      <div style="background:linear-gradient(135deg,#ea580c,#f59e0b);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
        <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">Welcome to HireCar! \uD83C\uDF89</h1>
      </div>
      <p style="color:#334155;font-size:16px;">Hi ${input.name || "there"},</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">${greeting}</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${dashboardUrl}" style="background:linear-gradient(135deg,#ea580c,#f59e0b);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">${ctaLabel} \u2192</a>
      </div>
      <p style="color:#94a3b8;font-size:13px;text-align:center;">Hire Car Marketplace \u00B7 Australia</p>
    </div>`,
  });
  return { skipped: false };
}

// ─── Marketing Email ───────────────────────────────────────────────────────────

export async function sendMarketingEmail(input: {
  to: string;
  recipientName: string;
  subject: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  if (!transporter) return { skipped: true };
  const cta = input.ctaLabel && input.ctaUrl
    ? `<div style="text-align:center;margin:28px 0;"><a href="${input.ctaUrl}" style="background:linear-gradient(135deg,#ea580c,#f59e0b);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">${input.ctaLabel} \u2192</a></div>`
    : "";
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: input.subject,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      ${LOGO_HTML}
      <div style="background:linear-gradient(135deg,#ea580c,#f59e0b);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
        <h1 style="color:#fff;font-size:22px;margin:0;font-weight:900;">${input.heading}</h1>
      </div>
      <p style="color:#334155;font-size:16px;">Hi ${input.recipientName},</p>
      <div style="color:#334155;font-size:15px;line-height:1.7;">${input.bodyHtml}</div>
      ${cta}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:32px;">You're receiving this because you have an account at hirecarmarketplace.com.au.</p>
    </div>`,
  });
  return { skipped: false };
}

// ─── Approval Emails ───────────────────────────────────────────────────────────

export async function sendVendorApprovalEmail(input: {
  to: string;
  vendorName: string;
}) {
  if (!transporter) return { skipped: true };
  const dashboardUrl = `${getAppUrl()}/vendor/dashboard`;
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: "Your Vendor Account is Approved! \uD83C\uDF89",
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      ${LOGO_HTML}
      <div style="background:linear-gradient(135deg,#16a34a,#22c55e);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
        <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">You are Approved! \u2705</h1>
      </div>
      <p style="color:#334155;font-size:16px;">Hi ${input.vendorName},</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">Great news! Your vendor account has been reviewed and approved by our team. You can now start adding your vehicles to the marketplace and receiving leads.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${dashboardUrl}" style="background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">Go to Dashboard \u2192</a>
      </div>
    </div>`,
  });
  return { skipped: false };
}

export async function sendVehicleApprovalEmail(input: {
  to: string;
  vehicleTitle: string;
}) {
  if (!transporter) return { skipped: true };
  const listingsUrl = `${getAppUrl()}/vendor/fleet`;
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: "Your Vehicle is Live! \uD83D\uDE97",
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      ${LOGO_HTML}
      <div style="background:linear-gradient(135deg,#ea580c,#f59e0b);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
        <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">Vehicle Approved! \uD83C\uDF8A</h1>
      </div>
      <p style="color:#334155;font-size:16px;">Great news!</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">Your listing for \u003cstrong\u003e${input.vehicleTitle}\u003c/strong\u003e has been approved and is now live on the marketplace for customers to see.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${listingsUrl}" style="background:linear-gradient(135deg,#ea580c,#f59e0b);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">View Fleet \u2192</a>
      </div>
    </div>`,
  });
  return { skipped: false };
}

// ─── Reminder Emails ───────────────────────────────────────────────────────────

export async function sendAdminPendingReminderEmail(input: {
  to: string;
  pendingVendorsCount: number;
  pendingVehiclesCount: number;
}) {
  if (!transporter) return { skipped: true };
  const adminUrl = `${getAppUrl()}/admin`;
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: "Pending Approvals Require Your Attention",
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      ${LOGO_HTML}
      <div style="background:linear-gradient(135deg,#3b82f6,#60a5fa);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
        <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">Action Required \u26A0\uFE0F</h1>
      </div>
      <p style="color:#334155;font-size:16px;">Hi Admin,</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">There are items in the moderation queue waiting for your approval:</p>
      <ul style="color:#334155;font-size:15px;line-height:1.6;">
        ${input.pendingVendorsCount > 0 ? `<li><strong>${input.pendingVendorsCount}</strong> pending vendors</li>` : ""}
        ${input.pendingVehiclesCount > 0 ? `<li><strong>${input.pendingVehiclesCount}</strong> pending vehicles</li>` : ""}
      </ul>
      <div style="text-align:center;margin:32px 0;">
        <a href="${adminUrl}" style="background:linear-gradient(135deg,#3b82f6,#60a5fa);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">Go to Admin Panel \u2192</a>
      </div>
    </div>`,
  });
  return { skipped: false };
}

export async function sendVendorUnreadLeadReminderEmail(input: {
  to: string;
  vendorName: string;
  unreadCount: number;
}) {
  if (!transporter) return { skipped: true };
  const dashboardUrl = `${getAppUrl()}/vendor/leads`;
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `You have ${input.unreadCount} unread lead(s)!`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      ${LOGO_HTML}
      <div style="background:linear-gradient(135deg,#ef4444,#f87171);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
        <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">Unread Leads \uD83D\uDCE7</h1>
      </div>
      <p style="color:#334155;font-size:16px;">Hi ${input.vendorName},</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">You have <strong>${input.unreadCount}</strong> lead(s) that are waiting for your response. Responding quickly improves your ranking and increases your bookings!</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${dashboardUrl}" style="background:linear-gradient(135deg,#ef4444,#f87171);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">View Leads \u2192</a>
      </div>
    </div>`,
  });
  return { skipped: false };
}

// ─── Internal utilities ─────────────────────────────────────────────────────────

export async function sendNewMessageNotification(input: {
  to: string;
  recipientName: string;
  senderName: string;
  vehicleTitle: string;
  messagePreview: string;
  leadId: string;
  isVendorRecipient: boolean;
}) {
  if (!transporter) return { skipped: true };
  const preview = sanitizeMessagePreview(input.messagePreview);
  const chatUrl = input.isVendorRecipient
    ? `${getAppUrl()}/vendor/leads/${input.leadId}`
    : `${getAppUrl()}/messages/${input.leadId}`;
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `New message about ${input.vehicleTitle}`,
    text: [`Hi ${input.recipientName},`, "", `${input.senderName} sent you a message about ${input.vehicleTitle}:`, "", `"${preview}"`, "", `Reply here: ${chatUrl}`].join("\n"),
  });
  return { skipped: false };
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
}) {
  if (!transporter) return { skipped: true };
  const to = process.env.CONTACT_EMAIL_TO ?? process.env.EMAIL_FROM ?? "support@hirecarmarketplace.com.au";
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "Hire Car Support <support@hirecarmarketplace.com.au>",
    to,
    replyTo: input.email,
    subject: `Hire Car contact: ${input.topic}`,
    text: [`Name: ${input.name}`, `Email: ${input.email}`, `Topic: ${input.topic}`, "", input.message].join("\n"),
  });
  return { skipped: false };
}

/** Maximum characters of untrusted inbound content included in a notification email. */
const WHATSAPP_PREVIEW_MAX_LENGTH = 300;

function sanitizeMessagePreview(raw: string): string {
  const collapsed = raw.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
  if (collapsed.length <= WHATSAPP_PREVIEW_MAX_LENGTH) return collapsed;
  return `${collapsed.slice(0, WHATSAPP_PREVIEW_MAX_LENGTH)}\u2026`;
}

async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  const attempts = Math.max(1, Math.floor(maxAttempts));
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }
    }
  }
  throw lastError;
}

export async function sendWhatsAppLeadAlert(
  input: {
    to: string;
    senderName: string;
    senderPhone: string;
    messagePreview: string;
    leadUrl: string;
  },
  maxAttempts = 3,
): Promise<{ skipped: boolean }> {
  if (!transporter) return { skipped: true };
  const preview = sanitizeMessagePreview(input.messagePreview);
  await withRetry(
    () => transporter!.sendMail({
      from: FROM,
      replyTo: REPLY_TO,
      to: input.to,
      subject: `New WhatsApp lead from ${input.senderName}`,
      text: [`${input.senderName} sent a new WhatsApp enquiry.`, "", `Name: ${input.senderName}`, `Phone: ${input.senderPhone}`, `Message: ${preview}`, "", `View the lead: ${input.leadUrl}`].join("\n"),
    }),
    maxAttempts,
  );
  return { skipped: false };
}

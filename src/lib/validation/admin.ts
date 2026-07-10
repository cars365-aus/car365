import { z } from "zod";

/** Admin: settings (per-key), redirects, lead pipeline actions. */

export const financeParamsSchema = z.object({
  annualRate: z.coerce.number().min(0).max(100),
  termMonths: z.coerce.number().int().min(1).max(120),
  depositPct: z.coerce.number().min(0).max(100),
  disclaimer: z.string().trim().min(10).max(1000),
});

export const companyProfileSchema = z.object({
  legalName: z.string().trim().min(1).max(200),
  tradingName: z.string().trim().min(1).max(200),
  abn: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email().max(160),
  googleRating: z.coerce.number().min(0).max(5).optional(),
  googleReviewCount: z.coerce.number().int().nonnegative().optional(),
});

export const notificationRecipientsSchema = z.object({
  emails: z.array(z.string().email()).max(20),
});

export const redirectSchema = z.object({
  id: z.string().uuid().optional(),
  fromPath: z.string().trim().startsWith("/").max(2048),
  toPath: z.string().trim().min(1).max(2048),
  code: z.coerce.number().int().refine((c) => [301, 302, 307, 308, 410].includes(c), {
    message: "code must be 301, 302, 307, 308, or 410",
  }),
});

/** Lead pipeline mutation (SRS §15.3). Loss reason required when marking lost. */
export const leadStatusUpdateSchema = z
  .object({
    leadId: z.string().uuid(),
    status: z.enum([
      "new", "contacted", "qualified", "inspection_scheduled",
      "negotiation", "won", "lost", "spam",
    ]),
    lossReason: z
      .enum(["price", "sold_elsewhere", "finance_declined", "unresponsive", "other"])
      .optional(),
  })
  .refine((d) => d.status !== "lost" || !!d.lossReason, {
    message: "A loss reason is required when marking a lead lost.",
    path: ["lossReason"],
  });

export const leadNoteSchema = z.object({
  leadId: z.string().uuid(),
  note: z.string().trim().min(1).max(4000),
});

export const leadAssignSchema = z.object({
  leadId: z.string().uuid(),
  assigneeId: z.string().uuid().nullable(),
});

export const leadReminderSchema = z.object({
  leadId: z.string().uuid(),
  dueAt: z.string().datetime(),
  note: z.string().trim().max(1000).optional(),
});

export const staffRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["owner", "admin", "manager", "sales", "content"]),
  active: z.boolean().optional().default(true),
});

export type FinanceParamsInput = z.infer<typeof financeParamsSchema>;
export type RedirectInput = z.infer<typeof redirectSchema>;
export type LeadStatusUpdateInput = z.infer<typeof leadStatusUpdateSchema>;

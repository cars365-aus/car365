import { z } from "zod";

/** Content admin validation: testimonials, FAQs, blog posts, CMS pages. */

export const testimonialSchema = z.object({
  id: z.string().uuid().optional(),
  customerName: z.string().trim().min(2).max(120),
  photoMediaId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  quote: z.string().trim().min(5).max(2000),
  source: z.enum(["google", "facebook", "direct"]).default("direct"),
  reviewDate: z.string().date().optional().or(z.literal("")),
  isApproved: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const faqSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().trim().min(2).max(60),
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(5).max(4000),
  sortOrder: z.coerce.number().int().optional().default(0),
  isPublished: z.boolean().optional().default(true),
});

export const blogPostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().min(3).max(200).regex(/^[a-z0-9-]+$/, "lowercase, hyphenated"),
  categoryId: z.string().uuid().optional(),
  coverMediaId: z.string().uuid().optional(),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  body: z.string().min(0),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
  publishedAt: z.string().datetime().optional().or(z.literal("")),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  readingMinutes: z.coerce.number().int().optional(),
});

export const pageSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(1).max(200),
  blocks: z.array(z.record(z.string(), z.unknown())).default([]),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  isPublished: z.boolean().optional().default(true),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;
export type FaqInput = z.infer<typeof faqSchema>;
export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type PageInput = z.infer<typeof pageSchema>;

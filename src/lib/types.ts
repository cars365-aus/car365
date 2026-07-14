/**
 * LEGACY (rental marketplace) domain types — pending removal.
 * Superseded by src/lib/domain.ts for the used-car pivot. Still referenced by a
 * handful of not-yet-rewritten pages/components; each import is removed as its
 * consumer migrates to domain.ts (Phase 3+). Do not add new usages.
 */
export type ApprovalStatus = "pending" | "approved" | "rejected" | "suspended";
export type LeadStatus = "new" | "contacted" | "converted" | "lost";
export type PlanCode = "starter" | "growth" | "pro";
export type MemberRole = "owner" | "admin" | "manager" | "staff";

export type Vehicle = {
  id: string;
  slug: string;
  title: string;
  make: string;
  model: string;
  year: number;
  city: string;
  state: string;
  seats: number;
  fuel: string;
  transmission: string;
  category: string;
  price: number;
  imageUrl: string;
  vendorName: string;
  vendorSlug: string;
  branchName: string;
  verified: boolean;
  avgRating?: number | null;
  reviewCount?: number | null;
  features?: string[];
  vendorLogoUrl?: string | null;
  noHiddenFees?: boolean;
};

export type Vendor = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  verified: boolean;
  vehicleCount: number;
  description: string;
  averageRating?: number;
  reviewCount?: number;
};

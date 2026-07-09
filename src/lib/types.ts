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
  pricePerDayAud: number;
  seats: number;
  fuel: string;
  transmission: string;
  category: string;
  imageUrl: string;
  vendorName: string;
  vendorSlug: string;
  branchName: string;
  verified: boolean;
  dailyDistanceLimitKm?: number | null;
  extraDistanceFeeAud?: number | null;
  instantBook?: boolean;
  // Card-enrichment fields. All optional so leaner data sources still satisfy
  // the type; the card renders each element only when its value is present.
  weeklyRateAud?: number | null;
  monthlyRateAud?: number | null;
  avgRating?: number | null;
  reviewCount?: number | null;
  features?: string[];
  vendorLogoUrl?: string | null;
  freeDelivery?: boolean;
  freeCancellation?: boolean;
  noHiddenFees?: boolean;
  superHost?: boolean;
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

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/security/auth";
import { clientIp } from "@/lib/security/rate-limit";
import { rateLimitSlidingWindow } from "@/lib/security/rate-limit-redis";
import { z } from "zod";
import { evaluateReview } from "@/lib/ai/review-moderation";

const reviewSchema = z.object({
  organizationId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  // customerName is intentionally NOT trusted from the client. The reviewer's
  // display name is always derived from their authenticated profile. The field
  // is accepted (and ignored) only for backward compatibility with the form.
  customerName: z.string().trim().max(120).optional(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to write a review." }, { status: 401 });
    }

    // Rate limit per authenticated user and per IP to prevent review spam.
    const ip = clientIp(request.headers);
    const [userLimit, ipLimit] = await Promise.all([
      rateLimitSlidingWindow(`review:user:${user.id}`, 5, 60 * 60 * 1000),
      rateLimitSlidingWindow(`review:ip:${ip}`, 10, 60 * 60 * 1000),
    ]);

    if (!userLimit.allowed || !ipLimit.allowed) {
      const retryAfter = userLimit.retryAfter ?? ipLimit.retryAfter ?? 3600;
      return NextResponse.json(
        { error: "Too many reviews submitted. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    const rawBody = await request.json();
    const payload = reviewSchema.safeParse(rawBody);

    if (!payload.success) {
      return NextResponse.json({ error: "Invalid review data provided" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify vendor exists and is approved.
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", payload.data.organizationId)
      .eq("status", "approved")
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: "Invalid vendor or vendor not available" }, { status: 400 });
    }

    // Derive the reviewer identity from the authenticated profile. Never trust
    // a client-supplied name.
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.email) {
      return NextResponse.json(
        { error: "Please complete your profile before leaving a review." },
        { status: 400 },
      );
    }

    // Require a genuine prior interaction: the reviewer must have an existing
    // lead (enquiry) with this vendor (and the specific vehicle, when provided).
    let leadQuery = supabase
      .from("leads")
      .select("id, vehicle_id")
      .eq("vendor_id", payload.data.organizationId)
      .eq("customer_email", profile.email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (payload.data.vehicleId) {
      leadQuery = leadQuery.eq("vehicle_id", payload.data.vehicleId);
    }

    const { data: leadRows } = await leadQuery;
    const lead = leadRows?.[0];

    if (!lead) {
      return NextResponse.json(
        { error: "You can only review vendors you have enquired with." },
        { status: 403 },
      );
    }

    // Prevent duplicate reviews: one review per enquiry (enforced by a unique
    // index on reviews.lead_id; this is the friendly pre-check).
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("lead_id", lead.id)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this enquiry." },
        { status: 409 },
      );
    }

    // AI moderation check (uses the trusted profile name).
    const reviewerName = profile.full_name || "Customer";
    const moderationResult = await evaluateReview({
      customerName: reviewerName,
      rating: payload.data.rating,
      body: payload.data.body,
    });

    const status = moderationResult.isApproved ? "approved" : "rejected";

    const { error: insertError } = await supabase
      .from("reviews")
      .insert({
        lead_id: lead.id,
        organization_id: payload.data.organizationId,
        vehicle_id: payload.data.vehicleId || lead.vehicle_id || null,
        customer_name: reviewerName,
        rating: payload.data.rating,
        body: payload.data.body,
        status: status,
      });

    if (insertError) {
      // Unique-violation safety net if two requests race past the pre-check.
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "You have already reviewed this enquiry." },
          { status: 409 },
        );
      }
      console.error("[Review API] Insert error:", insertError.message);
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: status }, { status: 201 });
  } catch (error) {
    console.error("[Review API] Exception:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

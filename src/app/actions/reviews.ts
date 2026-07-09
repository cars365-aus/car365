"use server";

import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const reviewSchema = z.object({
  leadId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  body: z.string().min(10).max(1000),
});

export async function submitReview(formData: FormData) {
  const user = await requireUser();

  try {
    const rawData = {
      leadId: formData.get("leadId") as string,
      rating: parseInt(formData.get("rating") as string, 10),
      body: formData.get("body") as string,
    };
    
    const parsed = reviewSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: "Invalid review data. Please provide a rating and a comment (10-1000 chars)." };
    }

    const supabase = createAdminClient();

    // Verify user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.email) {
      return { error: "You must complete your profile before leaving a review." };
    }

    // Verify lead ownership
    const { data: lead } = await supabase
      .from("leads")
      .select("id, vendor_id, vehicle_id")
      .eq("id", parsed.data.leadId)
      .eq("customer_email", profile.email)
      .single();

    if (!lead) {
      return { error: "You can only review vendors you have interacted with." };
    }

    const { data: existingReview, error: existingReviewError } = await supabase
      .from("reviews")
      .select("id")
      .eq("lead_id", lead.id)
      .maybeSingle();

    if (existingReviewError) {
      console.error("Failed to check existing review:", existingReviewError);
      return { error: "Failed to submit review. Please try again." };
    }

    if (existingReview) {
      return { error: "You have already reviewed this booking enquiry." };
    }

    // Insert Review
    const { error: insertError } = await supabase
      .from("reviews")
      .insert({
        lead_id: lead.id,
        organization_id: lead.vendor_id,
        vehicle_id: lead.vehicle_id,
        customer_name: profile.full_name || "Customer",
        rating: parsed.data.rating,
        body: parsed.data.body,
        status: "pending", // Requires admin approval
      });

    if (insertError) {
      console.error("Failed to insert review:", insertError);
      return { error: "Failed to submit review. Please try again." };
    }

    revalidatePath(`/messages/${lead.id}`);
    
    return { success: true };
  } catch (err) {
    console.error("Review submission exception:", err);
    return { error: "An unexpected error occurred." };
  }
}

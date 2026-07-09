import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCustomerEnquiryConfirmation, sendLeadAlert } from "@/lib/email/ses";
import { clientIp, hashIpForStorage } from "@/lib/security/rate-limit";
import { rateLimitSlidingWindow } from "@/lib/security/rate-limit-redis";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { leadSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const ipHash = hashIpForStorage(ip);

  // Use distributed Redis rate limiting by IP (falls back to memory if Redis unavailable)
  const ipLimit = await rateLimitSlidingWindow(`lead:ip:${ip}`, 5, 60_000);

  if (!ipLimit.allowed) {
    console.info(`[Lead API] Rate limit hit for IP ${ip}`);
    return NextResponse.json(
      {
        error: "Too many lead submissions",
        retryAfter: ipLimit.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter || 60) } },
    );
  }

  let rawBody;
  try {
    rawBody = await request.json();
  } catch {
    console.info(`[Lead API] Invalid JSON body from IP ${ip}`);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = leadSchema.safeParse(rawBody);

  if (!payload.success) {
    console.info(`[Lead API] Validation failed for IP ${ip}: ${payload.error.message}`);
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  // Rate limit by email to prevent distributed botting
  const emailLimit = await rateLimitSlidingWindow(`lead:email:${payload.data.email}`, 3, 60_000);
  
  if (!emailLimit.allowed) {
    console.info(`[Lead API] Rate limit hit for email (ip ${ipHash})`);
    return NextResponse.json(
      {
        error: "Too many lead submissions for this email",
        retryAfter: emailLimit.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter || 60) } },
    );
  }

  const challenge = await verifyTurnstile(payload.data.turnstileToken, ip);

  if (!challenge.ok) {
    console.info(`[Lead API] Turnstile challenge failed for IP ${ip}`);
    return NextResponse.json({ error: "Security challenge failed" }, { status: 403 });
  }

  const supabase = createAdminClient();

  // Validate vehicle exists and is approved
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id, title, organization_id, status, branch_id")
    .eq("id", payload.data.vehicleId)
    .eq("organization_id", payload.data.vendorId)
    .eq("status", "approved")
    .single();

  if (vehicleError || !vehicle) {
    console.info(`[Lead API] Vehicle not found or not approved: ${payload.data.vehicleId}`);
    return NextResponse.json(
      { error: "Invalid vehicle or vehicle not available" },
      { status: 400 },
    );
  }

  // Validate organization is approved
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, status, billing_email")
    .eq("id", payload.data.vendorId)
    .eq("status", "approved")
    .single();

  if (orgError || !organization) {
    console.info(`[Lead API] Organization not found or not approved: ${payload.data.vendorId}`);
    return NextResponse.json(
      { error: "Invalid vendor or vendor not available" },
      { status: 400 },
    );
  }

  // SECURITY: Validate pickup city matches one of the vendor's branch cities
  // This prevents spam leads with fake pickup locations
  const { data: branches } = await supabase
    .from("branches")
    .select("city")
    .eq("organization_id", payload.data.vendorId)
    .eq("status", "approved");

  const validCities = new Set(branches?.map((b) => b.city.toLowerCase()) ?? []);
  const requestedCity = payload.data.pickupCity.toLowerCase();

  if (!validCities.has(requestedCity)) {
    console.info(`[Lead API] Spam attempt detected: City ${payload.data.pickupCity} not valid for vendor ${payload.data.vendorId}`);
    
    // Log potential spam/fraud attempt but DO NOT block the lead 
    // because users might type partial city names (e.g. "Syd" instead of "Sydney")
    await supabase.from("fraud_flags").insert({
      resource_type: "lead_attempt",
      resource_id: payload.data.vehicleId,
      severity: "low",
      reason: `Pickup city "${payload.data.pickupCity}" does not strictly match vendor's branch cities: ${Array.from(validCities).join(", ")}`,
      status: "open",
    });
  }

  // Check for duplicate lead within last hour (same email + vehicle)
  const { data: duplicateLead } = await supabase
    .from("leads")
    .select("id")
    .eq("vehicle_id", payload.data.vehicleId)
    .eq("customer_email", payload.data.email)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .maybeSingle();

  if (duplicateLead) {
    console.info(`[Lead API] Returning existing lead ${duplicateLead.id} for vehicle ${payload.data.vehicleId}`);
    return NextResponse.json(
      { leadId: duplicateLead.id, duplicate: true },
      { status: 200 },
    );
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      vehicle_id: payload.data.vehicleId,
      vendor_id: payload.data.vendorId,
      customer_name: payload.data.name,
      customer_email: payload.data.email,
      customer_phone: payload.data.phone,
      pickup_city: payload.data.pickupCity,
      start_date: payload.data.startDate,
      end_date: payload.data.endDate,
      message: payload.data.message,
      ip_hash: ipHash,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[Lead API] Failed to save lead: ${error.message}`);
    return NextResponse.json({ error: "Unable to save lead" }, { status: 500 });
  }

  // Log lead event
  await supabase.from("lead_events").insert({
    lead_id: lead.id,
    event_type: "submitted",
    metadata: { ip_hash: ipHash },
  });

  // Send lead alert to vendor's actual billing email
  const vendorEmail = organization.billing_email;
  if (vendorEmail) {
    try {
      await sendLeadAlert({
        to: vendorEmail,
        vehicleTitle: vehicle.title,
        customerName: payload.data.name,
      });
      console.info(`[Lead API] Successfully processed lead ${lead.id} and sent vendor alert`);
    } catch (emailErr) {
      console.error(`[Lead API] Lead ${lead.id} created but failed to send email:`, emailErr);
    }
  } else {
    console.info(`[Lead API] Successfully processed lead ${lead.id} but vendor has no billing email`);
  }

  try {
    await sendCustomerEnquiryConfirmation({
      to: payload.data.email,
      customerName: payload.data.name,
      vehicleTitle: vehicle.title,
      leadId: lead.id,
    });
  } catch (emailErr) {
    console.error(`[Lead API] Lead ${lead.id} created but failed to send customer confirmation:`, emailErr);
  }

  return NextResponse.json({ leadId: lead.id, id: lead.id }, { status: 201 });
}

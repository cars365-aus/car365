import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TYPESENSE_API_KEY = Deno.env.get("TYPESENSE_API_KEY");
const TYPESENSE_HOST = Deno.env.get("TYPESENSE_HOST");

interface SearchIndexJob {
  id: string;
  vehicle_id: string;
  operation: "upsert" | "delete";
}

interface Vehicle {
  id: string;
  slug: string;
  title: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  fuel: string;
  transmission: string;
  category: string;
  price_per_day_aud: number;
  weekly_rate_aud: number | null;
  monthly_rate_aud: number | null;
  free_delivery: boolean;
  free_cancellation: boolean;
  no_hidden_fees: boolean;
  status: string;
  organization_id: string;
  organizations: {
    name: string;
    slug: string;
    status: string;
    logo_url: string | null;
    verified_at: string | null;
  };
  branches: {
    name: string;
    city: string;
    state: string;
    status: string;
  };
  vehicle_features: { feature: string }[] | null;
}

async function processTypesenseOperation(job: SearchIndexJob, vehicle: Vehicle | null) {
  if (!TYPESENSE_API_KEY || !TYPESENSE_HOST) {
    throw new Error("Typesense not configured");
  }

  const url = `https://${TYPESENSE_HOST}/collections/vehicles/documents`;

  if (job.operation === "delete") {
    const response = await fetch(`${url}/${job.vehicle_id}`, {
      method: "DELETE",
      headers: {
        "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY,
      },
    });

    // 404 is OK - document might not exist
    if (!response.ok && response.status !== 404) {
      throw new Error(`Delete failed: ${await response.text()}`);
    }

    return { deleted: true };
  }

  // For upsert, we need the vehicle data
  if (!vehicle) {
    return { skipped: true, reason: "Vehicle not found or not approved" };
  }

  // Check if both organization and branch are approved
  const org = vehicle.organizations;
  const branch = vehicle.branches;

  if (org.status !== "approved" || branch.status !== "approved" || vehicle.status !== "approved") {
    // Delete from index if not approved
    const response = await fetch(`${url}/${job.vehicle_id}`, {
      method: "DELETE",
      headers: {
        "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY,
      },
    });

    // 404 is OK - document might not exist
    if (!response.ok && response.status !== 404) {
      throw new Error(`Delete failed: ${await response.text()}`);
    }

    return { deleted: true, reason: "Not approved" };
  }

  const document = {
    id: vehicle.id,
    slug: vehicle.slug,
    title: vehicle.title,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    seats: vehicle.seats,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    category: vehicle.category,
    price_per_day_aud: vehicle.price_per_day_aud,
    weekly_rate_aud: vehicle.weekly_rate_aud,
    monthly_rate_aud: vehicle.monthly_rate_aud,
    free_delivery: vehicle.free_delivery,
    free_cancellation: vehicle.free_cancellation,
    no_hidden_fees: vehicle.no_hidden_fees,
    city: branch.city,
    state: branch.state,
    vendor_name: org.name,
    vendor_slug: org.slug,
    vendor_logo_url: org.logo_url,
    verified: org.verified_at != null,
    branch_name: branch.name,
    status: vehicle.status,
    organization_id: vehicle.organization_id,
    features: (vehicle.vehicle_features ?? []).map((f) => f.feature),
  };

  const response = await fetch(`${url}?action=upsert`, {
    method: "POST",
    headers: {
      "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    throw new Error(`Upsert failed: ${await response.text()}`);
  }

  return { upserted: true };
}

serve(async (req) => {
  // Verify authorization
  const authHeader = req.headers.get("Authorization");
  const expectedKey = Deno.env.get("WORKER_API_KEY");

  if (!expectedKey) {
    return new Response(JSON.stringify({ error: "Worker API key not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (authHeader !== `Bearer ${expectedKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch pending jobs
    const { data: pendingJobs, error: pendingError } = await supabase
      .from("search_index_jobs")
      .select("id, vehicle_id, operation, attempts")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (pendingError) throw new Error(`Failed to fetch pending jobs: ${pendingError.message}`);

    // Fetch retriable failed jobs
    const now = new Date().toISOString();
    const { data: failedJobs, error: failedError } = await supabase
      .from("search_index_jobs")
      .select("id, vehicle_id, operation, attempts")
      .eq("status", "failed")
      .lt("attempts", 3)
      .lte("next_run_at", now)
      .order("next_run_at", { ascending: true })
      .limit(10);

    if (failedError) throw new Error(`Failed to fetch failed jobs: ${failedError.message}`);

    const jobs = [...(pendingJobs || []), ...(failedJobs || [])].slice(0, 10);

    if (jobs.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No pending jobs" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = [];
    const errors = [];

    for (const job of jobs) {
      try {
        // Fetch vehicle data if needed
        let vehicle: Vehicle | null = null;

        if (job.operation === "upsert") {
          const { data: vehicleData, error: vehicleError } = await supabase
            .from("vehicles")
            .select(
              `
              id, slug, title, make, model, year, seats, fuel, transmission, category,
              price_per_day_aud, weekly_rate_aud, monthly_rate_aud,
              free_delivery, free_cancellation, no_hidden_fees, status, organization_id,
              organizations(name, slug, status, logo_url, verified_at),
              branches(name, city, state, status),
              vehicle_features(feature)
            `,
            )
            .eq("id", job.vehicle_id)
            .single();

          if (vehicleError) {
            // Vehicle might have been deleted
            vehicle = null;
          } else {
            vehicle = vehicleData as unknown as Vehicle;
          }
        }

        // Process with Typesense
        const result = await processTypesenseOperation(job as SearchIndexJob, vehicle);

        // Mark job as complete
        const { error: updateError } = await supabase
          .from("search_index_jobs")
          .update({
            status: "complete",
            processed_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        if (updateError) {
          throw new Error(`Failed to update job status: ${updateError.message}`);
        }

        results.push({ jobId: job.id, ...result });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Job ${job.id} failed:`, errorMessage);

        const newAttempts = (job.attempts || 0) + 1;
        // Exponential backoff: 2^attempts * 5 minutes
        const backoffMs = Math.pow(2, newAttempts) * 5 * 60 * 1000;
        const nextRunAt = new Date(Date.now() + backoffMs).toISOString();

        if (newAttempts >= 3) {
          console.error(`Job ${job.id} permanently failed after ${newAttempts} attempts.`);
        }

        // Mark job as failed with retry info
        await supabase
          .from("search_index_jobs")
          .update({
            status: "failed",
            error: errorMessage,
            last_error: errorMessage,
            attempts: newAttempts,
            next_run_at: nextRunAt
          })
          .eq("id", job.id);

        errors.push({ jobId: job.id, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        errors: errors.length,
        results,
        failed: errors,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Worker error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

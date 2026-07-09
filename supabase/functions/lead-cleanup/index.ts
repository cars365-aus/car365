import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get days parameter from request or use default
    let daysOld = 90;
    try {
      const body = await req.json();
      if (body.days !== undefined) {
        const parsedDays = Number(body.days);

        if (!Number.isInteger(parsedDays) || parsedDays < 30 || parsedDays > 3650) {
          return new Response(JSON.stringify({ error: "days must be an integer between 30 and 3650" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        daysOld = parsedDays;
      }
    } catch {
      // No body provided, use default
    }

    // Call the database function
    const { data, error } = await supabase.rpc("archive_old_leads", {
      p_days_old: daysOld,
    });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        archived: data?.[0]?.archived_count || 0,
        deleted: data?.[0]?.deleted_count || 0,
        days_old: daysOld,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

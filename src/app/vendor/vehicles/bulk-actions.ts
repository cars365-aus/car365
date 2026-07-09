"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/security/auth";
import { ensureUserCanManageOrganization, getVehicleLimitInfo } from "@/lib/data/vendor";
import { requirePlanFeature } from "@/lib/plan-features";
import { invalidatePseoForVehicle } from "@/lib/seo/vehicle-invalidation";
import * as xlsx from "xlsx";
import { uniqueSlug } from "@/lib/slug";

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set(["csv", "xlsx", "xls"]);

export async function processBulkUpload(formData: FormData) {
  try {
    const user = await requireUser();
    const organizationId = formData.get("organizationId") as string;
    const branchId = formData.get("branchId") as string;
    const fileValue = formData.get("file");

    if (!organizationId || !branchId || !(fileValue instanceof File)) {
      return { success: false, error: "Missing required fields" };
    }

    const file = fileValue;
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !SUPPORTED_EXTENSIONS.has(extension)) {
      return { success: false, error: "Unsupported file type. Upload a CSV, XLSX, or XLS file." };
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return { success: false, error: "The uploaded file is too large. Please upload a file smaller than 8 MB." };
    }

    await ensureUserCanManageOrganization(user.id, organizationId);
    await requirePlanFeature(organizationId, "bulkUpload");

    const supabase = createAdminClient();

    // Verify branch belongs to organization
    const { data: branch } = await supabase
      .from("branches")
      .select("id")
      .eq("id", branchId)
      .eq("organization_id", organizationId)
      .single();

    if (!branch) {
      return { success: false, error: "Invalid branch" };
    }

    // Read the file using xlsx
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: "array", cellDates: false });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return { success: false, error: "The uploaded file does not contain any sheets." };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = xlsx.utils.sheet_to_json(worksheet) as any[];

    if (rows.length === 0) {
      return { success: false, error: "The uploaded file is empty." };
    }

    const limitInfo = await getVehicleLimitInfo(organizationId);
    if (limitInfo.hasLimit && limitInfo.limit !== null) {
      if (limitInfo.currentCount + rows.length > limitInfo.limit) {
        return { success: false, error: `Upload rejected. Your current plan limit is ${limitInfo.limit} vehicles. You already have ${limitInfo.currentCount}, and this file contains ${rows.length} vehicles. Please upgrade your plan or upload fewer vehicles.` };
      }
    }

    const errors: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inserts: any[] = [];

    // Process each row
    rows.forEach((row, index) => {
      // Map common column names to our schema
      const make = String(row["Make"] || row["make"] || "");
      const model = String(row["Model"] || row["model"] || "");
      const year = parseInt(row["Year"] || row["year"]);
      const vin = String(row["Vin"] || row["VIN"] || row["vin"] || "");
      const licensePlate = String(row["License Plate"] || row["License_Plate"] || row["license_plate"] || "");
      const category = String(row["Category"] || row["category"] || "Sedan");
      const color = String(row["Color"] || row["color"] || "");
      const fuel = String(row["Fuel Type"] || row["Fuel_Type"] || row["fuel"] || "Petrol");
      const transmission = String(row["Transmission"] || row["transmission"] || "Automatic");
      const seats = parseInt(row["Seats"] || row["seats"] || "5");
      const dailyRate = parseInt(row["Daily Rate"] || row["daily_rate"] || row["price_per_day_aud"] || "0");
      const hourlyRate = parseInt(row["Hourly Rate"] || row["hourly_rate"] || "0");
      const weeklyRate = parseInt(row["Weekly Rate"] || row["weekly_rate"] || "0");
      const monthlyRate = parseInt(row["Monthly Rate"] || row["monthly_rate"] || "0");
      const weekendRate = parseInt(row["Weekend Rate"] || row["weekend_rate"] || "0");
      const extraMileageCharge = parseFloat(row["Extra Mileage Charge"] || row["extra_distance_fee_aud"] || "0");
      const milesPerDay = parseInt(row["Miles Per Day"] || row["daily_distance_limit_km"] || "0");
      const notes = String(row["Notes"] || row["notes"] || "");

      // Validate required fields
      if (!make || !model || isNaN(year) || isNaN(dailyRate) || dailyRate < 20) {
        errors.push(`Row ${index + 2}: Missing or invalid required fields (Make, Model, Year, Daily Rate).`);
        return;
      }

      inserts.push({
        organization_id: organizationId,
        branch_id: branchId,
        slug: uniqueSlug(`${make} ${model} ${year}`),
        title: `${year} ${make} ${model}`,
        make,
        model,
        year,
        seats: isNaN(seats) ? 5 : seats,
        fuel: fuel.charAt(0).toUpperCase() + fuel.slice(1).toLowerCase(), // e.g. "Diesel"
        transmission: transmission.charAt(0).toUpperCase() + transmission.slice(1).toLowerCase(),
        category,
        price_per_day_aud: dailyRate,
        daily_distance_limit_km: isNaN(milesPerDay) || milesPerDay === 0 ? null : milesPerDay,
        extra_distance_fee_aud: isNaN(extraMileageCharge) || extraMileageCharge === 0 ? null : extraMileageCharge,
        instant_book: false,
        status: "approved", // Bulk uploaded by vendor, we can set it to approved directly for enterprise users
        vin: vin || null,
        license_plate: licensePlate || null,
        color: color || null,
        hourly_rate_aud: isNaN(hourlyRate) || hourlyRate === 0 ? null : hourlyRate,
        weekly_rate_aud: isNaN(weeklyRate) || weeklyRate === 0 ? null : weeklyRate,
        monthly_rate_aud: isNaN(monthlyRate) || monthlyRate === 0 ? null : monthlyRate,
        weekend_rate_aud: isNaN(weekendRate) || weekendRate === 0 ? null : weekendRate,
        notes: notes || null,
      });
    });

    if (errors.length > 0 && inserts.length === 0) {
      return { success: false, errors };
    }

    if (inserts.length > 0) {
      const CHUNK_SIZE = 200;
      const allData: any[] = [];
      
      for (let i = 0; i < inserts.length; i += CHUNK_SIZE) {
        const chunk = inserts.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase.from("vehicles").insert(chunk).select("id");
        
        if (error) {
          return { success: false, error: `Database error during bulk insert (batch ${Math.floor(i / CHUNK_SIZE) + 1}): ` + error.message };
        }
        
        if (data) {
          allData.push(...data);
        }
      }
      
      const data = allData;

      // Create search index jobs for the inserted vehicles
      if (data && data.length > 0) {
        const jobs = data.map((v) => ({
          vehicle_id: v.id,
          operation: "upsert",
          status: "pending",
        }));
        
        // Batch insert jobs as well
        for (let i = 0; i < jobs.length; i += CHUNK_SIZE) {
          await supabase.from("search_index_jobs").insert(jobs.slice(i, i + CHUNK_SIZE));
        }

        // Run PSEO invalidation synchronously but individually to prevent enormous payloads
        for (const v of data) {
          await invalidatePseoForVehicle(supabase, v.id);
        }

        // Audit Log
        await supabase.from("audit_logs").insert({
          actor_user_id: user.id,
          action: "bulk_vehicles_created",
          resource_type: "organization",
          resource_id: organizationId,
          metadata: { count: data.length, branch_id: branchId },
        });
      }
    }

    revalidatePath("/vendor/vehicles");
    revalidatePath("/vendor/dashboard");

    return { 
      success: true, 
      count: inserts.length,
      errors: errors.length > 0 ? errors : undefined 
    };

  } catch (error) {
    console.error("Bulk upload error:", error);
    return { success: false, error: "An unexpected error occurred processing the file." };
  }
}

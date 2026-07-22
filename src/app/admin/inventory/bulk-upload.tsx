"use client";

import { useState, useRef } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { read, utils, writeFileXLSX } from "xlsx";
import { toast } from "sonner";
import { bulkUploadVehicles } from "./actions";

export function BulkUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    // Columns match the vehicleCsvRowSchema in src/lib/validation/vehicle.ts
    const headers = [
      "stock_id", "make", "model", "variant", "year", "mileage_km", 
      "fuel_type", "transmission", "body_type", "drive_type", "price", 
      "exterior_color", "description", "engine", "power_kw", "seats",
      "doors", "interior", "vin", "registration", "rego_expiry",
      "weekly_estimate", "safety_rating", "warranty_text",
      "roadworthy_included", "finance_available", "trade_in_welcome",
      "inspection_available", "dealer_notes"
    ];
    
    // Create an empty worksheet with just the headers
    const ws = utils.aoa_to_sheet([headers]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template");
    
    writeFileXLSX(wb, "vehicle_upload_template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Processing file...");

    try {
      const data = await file.arrayBuffer();
      const wb = read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws);
      
      if (!rows || rows.length === 0) {
        toast.error("File is empty or could not be parsed.", { id: toastId });
        return;
      }

      toast.loading(`Uploading ${rows.length} vehicles...`, { id: toastId });
      
      const result = await bulkUploadVehicles(rows);
      
      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success(`Successfully uploaded ${result.successCount} vehicles.`, { id: toastId });
        if (result.errors && result.errors.length > 0) {
          console.error("Row errors:", result.errors);
          toast.warning(`${result.errors.length} rows failed. Check console for details.`, { duration: 10000 });
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload file";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        type="button" 
        onClick={handleDownloadTemplate}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
        disabled={isUploading}
      >
        <Download className="size-4" /> Download Template
      </button>
      
      <button 
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
        disabled={isUploading}
      >
        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} 
        Upload
      </button>
      
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".csv, .xlsx" 
        className="hidden" 
        onChange={handleFileUpload}
      />
    </div>
  );
}

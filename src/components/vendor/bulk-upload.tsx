"use client";

import { useState } from "react";
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { processBulkUpload } from "@/app/vendor/vehicles/bulk-actions";

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_BYTES / 1024 / 1024;
const ACCEPTED_UPLOAD_TYPES = ".csv,.xlsx,.xls";

interface BulkUploadProps {
  organizationId: string;
  branches: Array<{ id: string; name: string }>;
}

export function BulkUpload({ organizationId, branches }: BulkUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success?: number; errors?: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const extension = selectedFile.name.split(".").pop()?.toLowerCase();

      if (!extension || !["csv", "xlsx", "xls"].includes(extension)) {
        setFile(null);
        setResult({ errors: ["Please upload a CSV or Excel spreadsheet (.csv, .xlsx, or .xls)."] });
        e.target.value = "";
        return;
      }

      if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
        setFile(null);
        setResult({ errors: [`Please upload a file smaller than ${MAX_UPLOAD_SIZE_MB} MB.`] });
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !branchId) return;

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("organizationId", organizationId);
    formData.append("branchId", branchId);

    try {
      const response = await processBulkUpload(formData);
      if (response.success) {
        setResult({ success: response.count });
        setFile(null);
      } else {
        setResult({ errors: response.errors || [response.error || "Upload failed"] });
      }
    } catch (error) {
      console.error("Bulk upload request failed:", error);
      setResult({
        errors: [
          `The upload request failed before the import could run. Please try a CSV or Excel file smaller than ${MAX_UPLOAD_SIZE_MB} MB.`,
        ],
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          Bulk Upload Vehicles
        </button>
        <a
          href="/templates/vehicle-upload-template.csv"
          download
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          title="Download CSV Template"
        >
          <Download className="h-4 w-4 text-blue-600" />
          Download Template
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm mb-6 relative">
      <button 
        onClick={() => setIsOpen(false)}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 shrink-0">
          <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">Bulk Upload Vehicles</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload your fleet spreadsheet. We support CSV and Excel formats. Ensure your columns match: Make, Model, Year, Category, Daily Rate, etc.{" "}
            <a href="/templates/vehicle-upload-template.csv" download className="text-emerald-600 font-semibold hover:underline">
              Download the template here.
            </a>
          </p>

          <form onSubmit={handleUpload} className="mt-6 space-y-4 max-w-xl">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">Assign to Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">Fleet File</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="mb-2 text-sm text-slate-500">
                      <span className="font-semibold text-emerald-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-400">CSV, XLSX, or XLS up to {MAX_UPLOAD_SIZE_MB} MB</p>
                  </div>
                  <input type="file" className="hidden" accept={ACCEPTED_UPLOAD_TYPES} onChange={handleFileChange} required />
                </label>
              </div>
              {file && <p className="text-sm font-medium text-emerald-700 mt-1 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> {file.name} selected</p>}
            </div>

            {result?.success !== undefined && (
              <div className="rounded-lg bg-emerald-100 border border-emerald-200 p-4 flex gap-3 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">Successfully imported {result.success} vehicles! You can now add images to them below.</p>
              </div>
            )}

            {result?.errors && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                <div className="flex gap-2 items-center font-bold mb-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  Import Failed
                </div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || isUploading}
              className="mt-2 flex w-full justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:bg-slate-400 transition-colors"
            >
              {isUploading ? "Processing..." : "Import Vehicles"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

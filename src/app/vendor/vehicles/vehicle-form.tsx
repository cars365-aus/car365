"use client";

import Image from "next/image";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, UploadCloud, X, AlertCircle, Loader2 } from "lucide-react";
import { createVehicle, updateVehicle } from "./actions";
import { getVehicleAutofill } from "./ai-actions";
import { uploadTempVehicleImage, deleteTempVehicleImage, deleteVehicleImage } from "./image-actions";
import { VEHICLE_FEATURES } from "@/lib/vehicle-badges";

interface VehicleFormProps {
  organizationId: string;
  branches: Array<{
    id: string;
    name: string;
    city: string;
  }>;
  isAtLimit: boolean;
  canUseAi?: boolean;
  editVehicle: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    seats: number;
    fuel: string;
    transmission: string;
    category: string;
    price_per_day_aud: number;
    daily_distance_limit_km?: number | null;
    extra_distance_fee_aud?: number | null;
    instant_book?: boolean;
    vin?: string | null;
    license_plate?: string | null;
    color?: string | null;
    hourly_rate_aud?: number | null;
    weekly_rate_aud?: number | null;
    monthly_rate_aud?: number | null;
    weekend_rate_aud?: number | null;
    notes?: string | null;
    features?: string[];
    free_delivery?: boolean;
    free_cancellation?: boolean;
    no_hidden_fees?: boolean;
    branch_id: string;
    status: string;
  } | null;
  editImages: Array<{
    id: string;
    storage_path: string;
    alt_text: string;
    sort_order: number;
    approved: boolean;
    url: string | null;
  }>;
}

const categories = ["Sedan", "SUV", "People mover", "Van", "Ute", "Luxury"];
const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric"];
const transmissions = ["Automatic", "Manual"];

type PendingImage = {
  id: string; // local id
  file: File;
  previewUrl: string;
  uploading: boolean;
  error?: string;
  serverPath?: string;
};

export default function VehicleForm({
  organizationId,
  branches,
  isAtLimit,
  canUseAi = false,
  editVehicle,
  editImages: initialEditImages,
}: VehicleFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingImage[]>([]);
  const [editImages, setEditImages] = useState(initialEditImages);
  
  const [notes, setNotes] = useState(editVehicle?.notes || "");
  const [aiLoading, setAiLoading] = useState(false);
  const [formState, setFormState] = useState({
    title: editVehicle?.title || "",
    seats: editVehicle?.seats || 5,
    fuel: editVehicle?.fuel || "Petrol",
    transmission: editVehicle?.transmission || "Automatic",
    category: editVehicle?.category || "Sedan",
  });

  const isUploading = pendingUploads.some(img => img.uploading);

  async function handleAiGenerate(form: HTMLFormElement) {
    if (!canUseAi) return;
    const make = String(new FormData(form).get("make") ?? "");
    const model = String(new FormData(form).get("model") ?? "");
    const year = Number(new FormData(form).get("year") ?? new Date().getFullYear());
    
    if (!make || !model || !year) {
      toast.error("Please fill out Make, Model, and Year first.");
      return;
    }

    setAiLoading(true);
    try {
      const result = await getVehicleAutofill({ organizationId, make, model, year });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setFormState({
        title: result.data.title,
        seats: result.data.seats,
        fuel: result.data.fuel,
        transmission: result.data.transmission,
        category: result.data.category,
      });
      setNotes(result.data.description);
      toast.success("Magic Autofill complete!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  // Handle Drag and Drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [pendingUploads.length, editImages.length]);

  const handleFilesSelected = async (files: File[]) => {
    if (isSubmitting) return;

    const currentTotal = editImages.length + pendingUploads.length;
    if (currentTotal + files.length > 10) {
      toast.error("Maximum 10 images per vehicle allowed.");
      files = files.slice(0, 10 - currentTotal);
    }

    if (files.length === 0) return;

    const newPending: PendingImage[] = files.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      previewUrl: URL.createObjectURL(f),
      uploading: true,
    }));

    setPendingUploads(prev => [...prev, ...newPending]);

    // Instantly upload files
    for (const pending of newPending) {
      const imgData = new FormData();
      imgData.append("organizationId", organizationId);
      imgData.append("file", pending.file);

      try {
        const res = await uploadTempVehicleImage(imgData);
        setPendingUploads(prev => prev.map(p => {
          if (p.id === pending.id) {
            if (res.success) {
              return { ...p, uploading: false, serverPath: res.path, previewUrl: res.url || p.previewUrl };
            } else {
              toast.error(`Upload failed: ${res.error}`);
              return { ...p, uploading: false, error: res.error };
            }
          }
          return p;
        }));
      } catch (err) {
        toast.error("Network error during upload");
        setPendingUploads(prev => prev.map(p => p.id === pending.id ? { ...p, uploading: false, error: "Network error" } : p));
      }
    }
  };

  const removePendingImage = async (id: string) => {
    const img = pendingUploads.find(p => p.id === id);
    setPendingUploads(prev => prev.filter(p => p.id !== id));
    if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
    
    // Cleanup on server if it was uploaded
    if (img?.serverPath && !img.uploading) {
      const fd = new FormData();
      fd.append("organizationId", organizationId);
      fd.append("path", img.serverPath);
      await deleteTempVehicleImage(fd).catch(console.error);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!editVehicle || !confirm("Delete this image?")) return;

    const formData = new FormData();
    formData.append("imageId", imageId);
    formData.append("organizationId", organizationId);

    const result = await deleteVehicleImage(formData);

    if (result.success) {
      toast.success("Image deleted");
      setEditImages(prev => prev.filter(img => img.id !== imageId));
    } else {
      toast.error(result.error);
    }
  };

  async function handleSubmit(formData: FormData) {
    if (isUploading) {
      toast.error("Please wait for images to finish uploading before saving.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    formData.append("organizationId", organizationId);

    // Append successfully uploaded temp images
    const tempPaths = pendingUploads
      .filter(p => p.serverPath && !p.error)
      .map(p => p.serverPath);
    
    if (tempPaths.length > 0) {
      formData.append("tempImagePaths", JSON.stringify(tempPaths));
    }

    try {
      const result = editVehicle
        ? await updateVehicle(formData)
        : await createVehicle(formData);

      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        setIsSubmitting(false);
        // Scroll to top to see error
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      toast.success(editVehicle ? "Vehicle updated successfully!" : "Vehicle created successfully!");
      
      if (!editVehicle) {
        setPendingUploads([]);
        setNotes("");
        setFormState({ title: "", seats: 5, fuel: "Petrol", transmission: "Automatic", category: "Sedan" });
        const formEl = document.getElementById("vehicle-form") as HTMLFormElement;
        if (formEl) formEl.reset();
      }
      
      router.push(`/vendor/vehicles?org=${organizationId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: `Error: ${msg}` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form id="vehicle-form" action={handleSubmit} className="relative pb-24">
      {editVehicle && <input type="hidden" name="vehicleId" value={editVehicle.id} />}
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {editVehicle ? "Edit Vehicle" : "Add New Vehicle"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {editVehicle ? "Update your vehicle listing details below." : "Enter the details for your new vehicle listing."}
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 rounded-lg p-4 flex gap-3 items-start border shadow-sm ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-900 border-emerald-200" 
            : "bg-red-50 text-red-900 border-red-200"
        }`}>
          {message.type === "error" && <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />}
          <div className="font-medium text-sm leading-relaxed">{message.text}</div>
        </div>
      )}

      {isAtLimit && !editVehicle && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 flex gap-3 items-start shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          You have reached your vehicle limit. Upgrade your plan to add more vehicles.
        </div>
      )}

      <div className="space-y-8">
        
        {/* Section 1: Basic Information */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Basic Information</h2>
            {canUseAi && (
              <button
                type="button"
                disabled={aiLoading}
                onClick={(e) => handleAiGenerate(document.getElementById("vehicle-form") as HTMLFormElement)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 border border-orange-200"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {aiLoading ? "Thinking..." : "Magic Autofill"}
              </button>
            )}
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Listing Title
              <input name="title" value={formState.title} onChange={(e) => setFormState({ ...formState, title: e.target.value })} required maxLength={140} placeholder="e.g., 2023 Toyota Camry Hybrid" className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
            </label>
            
            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Branch Location
              <select name="branchId" defaultValue={editVehicle?.branch_id || ""} required className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all">
                <option value="">Select a branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Make
              <input name="make" defaultValue={editVehicle?.make || ""} required maxLength={80} placeholder="e.g., Toyota" className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Model
              <input name="model" defaultValue={editVehicle?.model || ""} required maxLength={80} placeholder="e.g., Camry" className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Year
              <input name="year" type="number" defaultValue={editVehicle?.year || new Date().getFullYear()} required min={1990} max={2030} className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Category
              <select name="category" value={formState.category} onChange={(e) => setFormState({ ...formState, category: e.target.value })} required className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
        </section>

        {/* Section 2: Specifications */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Specifications</h2>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Seats
              <input name="seats" type="number" value={formState.seats} onChange={(e) => setFormState({ ...formState, seats: Number(e.target.value) })} required min={2} max={12} className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Fuel Type
              <select name="fuel" value={formState.fuel} onChange={(e) => setFormState({ ...formState, fuel: e.target.value })} required className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all">
                {fuelTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Transmission
              <select name="transmission" value={formState.transmission} onChange={(e) => setFormState({ ...formState, transmission: e.target.value })} required className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all">
                {transmissions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
        </section>

        {/* Section 3: Pricing & Terms */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Pricing & Rules</h2>
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="text-sm font-semibold text-amber-700 group-hover:text-amber-800 transition-colors">Instant Book ⚡</span>
              <input type="checkbox" name="instantBook" defaultChecked={editVehicle?.instant_book || false} className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-600 transition-all cursor-pointer" />
            </label>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-2 text-sm font-medium text-slate-900 lg:col-span-2">
              Daily Price (AUD)
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input name="pricePerDayAud" type="number" defaultValue={editVehicle?.price_per_day_aud || ""} required min={20} max={2000} className="w-full rounded-lg border-slate-200 bg-white pl-7 pr-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" placeholder="75" />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Weekly Rate
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input name="weeklyRateAud" type="number" defaultValue={editVehicle?.weekly_rate_aud || ""} min={0} placeholder="Optional" className="w-full rounded-lg border-slate-200 bg-white pl-7 pr-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Monthly Rate
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input name="monthlyRateAud" type="number" defaultValue={editVehicle?.monthly_rate_aud || ""} min={0} placeholder="Optional" className="w-full rounded-lg border-slate-200 bg-white pl-7 pr-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Daily KM Limit
              <input name="dailyDistanceLimitKm" type="number" defaultValue={editVehicle?.daily_distance_limit_km || ""} min={50} max={1000} placeholder="Leave blank for unlimited" className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Extra KM Fee ($/km)
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input name="extraDistanceFeeAud" type="number" step="0.01" defaultValue={editVehicle?.extra_distance_fee_aud || ""} min={0.1} max={5.0} placeholder="0.35" className="w-full rounded-lg border-slate-200 bg-white pl-7 pr-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Weekend Rate
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input name="weekendRateAud" type="number" defaultValue={editVehicle?.weekend_rate_aud || ""} min={0} placeholder="Optional" className="w-full rounded-lg border-slate-200 bg-white pl-7 pr-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
              </div>
            </label>
            
            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Hourly Rate
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input name="hourlyRateAud" type="number" defaultValue={editVehicle?.hourly_rate_aud || ""} min={0} placeholder="Optional" className="w-full rounded-lg border-slate-200 bg-white pl-7 pr-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
              </div>
            </label>
          </div>
        </section>

        {/* Section 3b: Features & Inclusions */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Features & Inclusions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Shown on your listing card to help renters choose.</p>
          </div>
          <div className="p-6 space-y-6">
            <fieldset className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {VEHICLE_FEATURES.map((feature) => (
                <label key={feature} className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="features"
                    value={feature}
                    defaultChecked={editVehicle?.features?.includes(feature) ?? false}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  {feature}
                </label>
              ))}
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-3 border-t border-slate-100 pt-6">
              <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" name="freeDelivery" defaultChecked={editVehicle?.free_delivery || false} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer" />
                Free delivery available
              </label>
              <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" name="freeCancellation" defaultChecked={editVehicle?.free_cancellation || false} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer" />
                Free cancellation
              </label>
              <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" name="noHiddenFees" defaultChecked={editVehicle?.no_hidden_fees || false} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer" />
                No hidden fees
              </label>
            </div>
          </div>
        </section>

        {/* Section 4: Details & Notes */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Listing Description & Internal Data</h2>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-900 md:col-span-2">
              Public Description / Notes
              <textarea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={4} placeholder="Describe the vehicle's condition, features, or rental rules..." className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              VIN (Internal only)
              <input name="vin" defaultValue={editVehicle?.vin || ""} maxLength={100} placeholder="Vehicle Identification Number" className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal uppercase text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              License Plate (Internal only)
              <input name="licensePlate" defaultValue={editVehicle?.license_plate || ""} maxLength={40} placeholder="e.g., ABC-123" className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal uppercase text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-900">
              Color
              <input name="color" defaultValue={editVehicle?.color || ""} maxLength={60} placeholder="e.g., Pearl White" className="rounded-lg border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all" />
            </label>
          </div>
        </section>

        {/* Section 5: Image Dropzone */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Vehicle Images</h2>
              <p className="text-xs text-slate-500 mt-0.5">Drag & drop up to 10 images. They upload instantly.</p>
            </div>
            <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-1 rounded-full">
              {editImages.length + pendingUploads.length} / 10
            </span>
          </div>
          
          <div className="p-6">
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer group ${
                isUploading 
                  ? "border-slate-300 bg-slate-50" 
                  : "border-slate-300 hover:border-brand-500 hover:bg-brand-50/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                disabled={isSubmitting || editImages.length + pendingUploads.length >= 10}
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                  e.target.value = "";
                }}
              />
              <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Click to browse or drag images here</p>
              <p className="text-xs text-slate-500 mt-1">JPEG, PNG, WEBP up to 10MB</p>
            </div>

            {/* Image Grid Preview */}
            {(editImages.length > 0 || pendingUploads.length > 0) && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                
                {/* Existing Images */}
                {editImages.map((img) => (
                  <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                    {img.url ? (
                      <Image src={img.url} alt={img.alt_text || "Vehicle image"} fill className="object-cover transition-transform group-hover:scale-105" />
                    ) : null}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transform scale-90 group-hover:scale-100 transition-all shadow-lg" title="Delete image">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {!img.approved && (
                      <span className="absolute bottom-2 left-2 right-2 text-center rounded bg-amber-500/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold text-white shadow-sm uppercase tracking-wider">
                        Pending Moderation
                      </span>
                    )}
                  </div>
                ))}

                {/* Newly Dropped & Uploading Images */}
                {pendingUploads.map((pending) => (
                  <div key={pending.id} className={`group relative aspect-square rounded-xl overflow-hidden border shadow-sm ${pending.error ? "border-red-300" : "border-slate-200"} bg-slate-50`}>
                    <Image src={pending.previewUrl} alt="Pending upload" fill className={`object-cover transition-all ${pending.uploading ? "opacity-40 scale-105 blur-sm" : ""}`} />
                    
                    {pending.uploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
                        <span className="text-[10px] font-bold text-slate-900 bg-white/80 px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">UPLOADING...</span>
                      </div>
                    )}

                    {pending.error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 backdrop-blur-[1px] p-2 text-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mb-1" />
                        <span className="text-[10px] font-bold text-red-700 leading-tight">FAILED</span>
                      </div>
                    )}

                    {!pending.uploading && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <button type="button" onClick={(e) => { e.stopPropagation(); removePendingImage(pending.id); }} className="bg-slate-800 hover:bg-slate-900 text-white rounded-full p-2 transform scale-90 group-hover:scale-100 transition-all shadow-lg" title="Remove image">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {!pending.uploading && !pending.error && (
                       <span className="absolute bottom-2 left-2 right-2 text-center rounded bg-emerald-500/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold text-white shadow-sm uppercase tracking-wider">
                         Ready to Save
                       </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-4 z-20 mt-8 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-600 hidden sm:block">
            {isUploading ? "Uploading images..." : "Ready to save."}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {editVehicle && (
              <button
                type="button"
                onClick={() => router.push(`/vendor/vehicles?org=${organizationId}`)}
                className="flex-1 sm:flex-none rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || (isAtLimit && !editVehicle) || isUploading}
              className="flex-1 sm:flex-none rounded-lg bg-slate-900 px-8 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting 
                ? "Saving..." 
                : isUploading 
                  ? "Uploading..." 
                  : editVehicle ? "Save Changes" : "Create Vehicle"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

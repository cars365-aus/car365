"use client";

import { useActionState, useState, useRef } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { fuelTypes, transmissionTypes, bodyTypes, driveTypes, vehicleStatuses } from "@/lib/validation/vehicle";
import { FUEL_LABELS, TRANSMISSION_LABELS, BODY_TYPE_LABELS, DRIVE_LABELS } from "@/lib/nav";
import type { Make, Model, Feature, LocationBranch, FeatureCategory } from "@/lib/domain";
import { ChevronRight, ChevronLeft, Car, Gauge, DollarSign, Star, Image as ImageIcon, Loader2, Check as CheckIcon, Plus } from "lucide-react";
import { ImageUpload, UploadedImage } from "./image-upload";
import { createMake, createModel } from "@/app/admin/catalogue/actions";

type ActionResult = { ok?: boolean; error?: string } | void;
type Action = (state: ActionResult, formData: FormData) => Promise<ActionResult>;

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow";

// A vehicle row (snake_case) for edit mode, loosely typed.
type VehicleData = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const STEPS = [
  { value: "basics",   label: "Basics",         icon: Car },
  { value: "specs",    label: "Specs",          icon: Gauge },
  { value: "pricing",  label: "Pricing",        icon: DollarSign },
  { value: "features", label: "Features",       icon: Star },
  { value: "images",   label: "Images & Notes", icon: ImageIcon },
] as const;

type StepValue = (typeof STEPS)[number]["value"];

export function VehicleForm({
  action,
  makes: initialMakes,
  models: initialModels,
  features,
  locations,
  vehicle,
  selectedFeatureIds = [],
  mode,
}: {
  action: Action;
  makes: Make[];
  models: Model[];
  features: Feature[];
  locations: LocationBranch[];
  vehicle?: VehicleData;
  selectedFeatureIds?: string[];
  mode: "create" | "edit";
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  
  // Local state for dynamic Makes/Models
  const [makes, setMakes] = useState<Make[]>(initialMakes);
  const [models, setModels] = useState<Model[]>(initialModels);
  
  const [makeId, setMakeId] = useState<string>(vehicle?.make_id ?? "");
  const [modelId, setModelId] = useState<string>(vehicle?.model_id ?? "");
  const [activeTab, setActiveTab] = useState<StepValue>("basics");
  const formRef = useRef<HTMLFormElement>(null);

  // Inline creation states
  const [isAddingMake, setIsAddingMake] = useState(false);
  const [newMakeName, setNewMakeName] = useState("");
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [isCreatingInline, setIsCreatingInline] = useState(false);

  const v = vehicle ?? {};
  
  // Transform existing images if in edit mode
  const initialImages: UploadedImage[] = (v.images || []).map((img: any) => ({
    path: img.media.storage_key,
    url: img.media.url || img.url, // fallback
    isCover: img.is_cover
  }));

  const modelsForMake = models.filter((m) => m.makeId === makeId);
  const featureGroups = (["comfort", "safety", "technology", "exterior"] as FeatureCategory[])
    .map((cat) => ({ cat, items: features.filter((f) => f.category === cat) }));

  const currentIndex = STEPS.findIndex((s) => s.value === activeTab);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === STEPS.length - 1;

  function validateCurrentStep(): boolean {
    if (!formRef.current) return true;
    const panel = formRef.current.querySelector(`[data-step="${activeTab}"]`);
    if (panel) {
      const inputs = panel.querySelectorAll('input[required], select[required], textarea[required]');
      for (const input of Array.from(inputs)) {
        if (!(input as any).checkValidity()) {
          (input as any).reportValidity();
          return false; // Stop and show HTML5 error on the specific input
        }
      }
    }
    return true;
  }

  function goNext() {
    if (validateCurrentStep() && !isLast) {
      setActiveTab(STEPS[currentIndex + 1].value);
    }
  }
  
  function goPrev() {
    if (!isFirst) setActiveTab(STEPS[currentIndex - 1].value);
  }

  async function handleAddMake() {
    if (!newMakeName.trim()) return;
    setIsCreatingInline(true);
    const fd = new FormData();
    fd.append("name", newMakeName);
    const res = await createMake(null, fd);
    if (res.ok && res.id) {
      setMakes([...makes, { id: res.id, name: newMakeName.trim(), slug: "", isPopular: false }]);
      setMakeId(res.id);
      setIsAddingMake(false);
      setNewMakeName("");
    } else {
      alert(res.error || "Failed to create make");
    }
    setIsCreatingInline(false);
  }

  async function handleAddModel() {
    if (!newModelName.trim() || !makeId) return;
    setIsCreatingInline(true);
    const fd = new FormData();
    fd.append("name", newModelName);
    fd.append("makeId", makeId);
    const res = await createModel(null, fd);
    if (res.ok && res.id) {
      setModels([...models, { id: res.id, makeId, name: newModelName.trim(), slug: "" }]);
      setModelId(res.id);
      setIsAddingModel(false);
      setNewModelName("");
    } else {
      alert(res.error || "Failed to create model");
    }
    setIsCreatingInline(false);
  }

  // Intercept form submission to validate all fields (especially for edit mode where tabs can be skipped)
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (mode === "create" && !validateCurrentStep()) {
      e.preventDefault();
      return;
    }
    
    // In edit mode, if they click save but a hidden tab is invalid, find it and switch to it
    if (mode === "edit" && formRef.current && !formRef.current.checkValidity()) {
      e.preventDefault();
      const firstInvalid = formRef.current.querySelector(':invalid');
      if (firstInvalid) {
        const panel = firstInvalid.closest('[data-step]');
        if (panel) {
          const stepValue = panel.getAttribute('data-step') as StepValue;
          setActiveTab(stepValue);
          setTimeout(() => (firstInvalid as HTMLElement).focus(), 100);
        }
      }
    }
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-6">
      {mode === "edit" ? <input type="hidden" name="id" value={v.id} /> : null}

      {/* Step progress bar — create mode only */}
      {mode === "create" && (
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.value === activeTab;
            const isDone = i < currentIndex;
            return (
              <div key={step.value} className="flex flex-1 items-center">
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isDone
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckIcon className="size-3.5 shrink-0" />
                  ) : (
                    <Icon className="size-3.5 shrink-0" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 transition-colors ${i < currentIndex ? "bg-primary/40" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => {
        if (mode === "edit") setActiveTab(v as StepValue);
        // In create mode, we disable clicking tabs directly to enforce the wizard flow
      }}>
        {/* Tab list — edit mode only (create mode uses the step bar above) */}
        {mode === "edit" && (
          <TabsList>
            {STEPS.map((s) => (
              <TabsTab key={s.value} value={s.value}>{s.label}</TabsTab>
            ))}
          </TabsList>
        )}

        <TabsPanel value="basics" data-step="basics">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <L label="Stock ID"><input name="stockId" defaultValue={v.stock_id} disabled={mode === "edit"} className={inputCls} placeholder="A1042" /></L>
            <L label="Year"><input name="year" type="number" defaultValue={v.year} className={inputCls} /></L>
            
            <L label="Make">
              {!isAddingMake ? (
                <>
                  <select name="makeId" value={makeId} onChange={(e) => {
                    if (e.target.value === "new") setIsAddingMake(true);
                    else {
                      setMakeId(e.target.value);
                      setModelId(""); // reset model when make changes
                    }
                  }} className={inputCls}>
                    <option value="">Select make…</option>
                    {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    <option value="new" className="font-semibold text-primary">+ Add New Make...</option>
                  </select>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <input type="hidden" name="makeId" value={makeId} />
                  <input autoFocus placeholder="New make name" value={newMakeName} onChange={(e) => setNewMakeName(e.target.value)} className={inputCls} />
                  <button type="button" disabled={isCreatingInline} onClick={handleAddMake} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Save</button>
                  <button type="button" onClick={() => setIsAddingMake(false)} className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">Cancel</button>
                </div>
              )}
            </L>

            <L label="Model">
              {!isAddingModel ? (
                <select name="modelId" value={modelId} onChange={(e) => {
                  if (e.target.value === "new") setIsAddingModel(true);
                  else setModelId(e.target.value);
                }} className={inputCls} disabled={!makeId || isAddingMake}>
                  <option value="">Select model…</option>
                  {modelsForMake.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  {makeId && <option value="new" className="font-semibold text-primary">+ Add New Model...</option>}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <input type="hidden" name="modelId" value={modelId} />
                  <input autoFocus placeholder="New model name" value={newModelName} onChange={(e) => setNewModelName(e.target.value)} className={inputCls} />
                  <button type="button" disabled={isCreatingInline} onClick={handleAddModel} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Save</button>
                  <button type="button" onClick={() => setIsAddingModel(false)} className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">Cancel</button>
                </div>
              )}
            </L>
            <L label="Variant"><input name="variant" defaultValue={v.variant ?? ""} className={inputCls} placeholder="GXL" /></L>
            <L label="Mileage (km)"><input name="mileageKm" type="number" defaultValue={v.mileage_km} className={inputCls} /></L>
            <L label="Status">
              <select name="status" defaultValue={v.status ?? "draft"} className={inputCls}>
                {vehicleStatuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </L>
            <L label="Location">
              <select name="locationId" defaultValue={v.location_id ?? ""} className={inputCls}>
                <option value="">—</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.city})</option>)}
              </select>
            </L>
          </div>
        </TabsPanel>

        <TabsPanel value="specs" data-step="specs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <L label="Fuel"><select name="fuelType" defaultValue={v.fuel_type ?? ""} className={inputCls}><option value="">—</option>{fuelTypes.map((f) => <option key={f} value={f}>{FUEL_LABELS[f]}</option>)}</select></L>
            <L label="Transmission"><select name="transmission" defaultValue={v.transmission ?? ""} className={inputCls}><option value="">—</option>{transmissionTypes.map((t) => <option key={t} value={t}>{TRANSMISSION_LABELS[t]}</option>)}</select></L>
            <L label="Body type"><select name="bodyType" defaultValue={v.body_type ?? ""} className={inputCls}><option value="">—</option>{bodyTypes.map((b) => <option key={b} value={b}>{BODY_TYPE_LABELS[b]}</option>)}</select></L>
            <L label="Drive"><select name="driveType" defaultValue={v.drive_type ?? ""} className={inputCls}><option value="">—</option>{driveTypes.map((d) => <option key={d} value={d}>{DRIVE_LABELS[d]}</option>)}</select></L>
            <L label="Engine"><input name="engine" defaultValue={v.engine ?? ""} className={inputCls} placeholder="2.0L 4-cyl turbo" /></L>
            <L label="Power (kW)"><input name="powerKw" type="number" defaultValue={v.power_kw ?? ""} className={inputCls} /></L>
            <L label="Seats"><input name="seats" type="number" defaultValue={v.seats ?? ""} className={inputCls} /></L>
            <L label="Doors"><input name="doors" type="number" defaultValue={v.doors ?? ""} className={inputCls} /></L>
            <L label="Exterior colour"><input name="exteriorColor" defaultValue={v.exterior_color ?? ""} className={inputCls} /></L>
            <L label="Interior"><input name="interior" defaultValue={v.interior ?? ""} className={inputCls} /></L>
            <L label="VIN"><input name="vin" defaultValue={v.vin ?? ""} className={inputCls} maxLength={17} /></L>
            <L label="Registration"><input name="registration" defaultValue={v.registration ?? ""} className={inputCls} /></L>
            <L label="Rego expiry"><input name="regoExpiry" type="date" defaultValue={v.rego_expiry ?? ""} className={inputCls} /></L>
            <L label="Safety rating"><input name="safetyRating" defaultValue={v.safety_rating ?? ""} className={inputCls} placeholder="5-star ANCAP" /></L>
          </div>
        </TabsPanel>

        <TabsPanel value="pricing" data-step="pricing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <L label="Price ($)"><input name="price" type="number" step="0.01" defaultValue={v.price} className={inputCls} /></L>
            <L label="Weekly estimate ($)"><input name="weeklyEstimate" type="number" defaultValue={v.weekly_estimate ?? ""} className={inputCls} placeholder="auto if blank" /></L>
            <L label="Warranty"><input name="warrantyText" defaultValue={v.warranty_text ?? ""} className={inputCls} placeholder="3-month dealer warranty" /></L>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <Check name="roadworthyIncluded" label="Roadworthy included" defaultChecked={v.roadworthy_included ?? false} />
            <Check name="financeAvailable" label="Finance available" defaultChecked={v.finance_available ?? true} />
            <Check name="tradeInWelcome" label="Trade-in welcome" defaultChecked={v.trade_in_welcome ?? true} />
            <Check name="inspectionAvailable" label="Inspection available" defaultChecked={v.inspection_available ?? true} />
            <Check name="isFeatured" label="Featured" defaultChecked={v.is_featured ?? false} />
          </div>
        </TabsPanel>

        <TabsPanel value="features" data-step="features">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {featureGroups.map((g) => (
              <div key={g.cat}>
                <h3 className="mb-2 text-sm font-semibold capitalize text-foreground">{g.cat}</h3>
                <div className="space-y-1.5">
                  {g.items.map((f) => (
                    <label key={f.id} className="flex items-center gap-2 text-sm text-body">
                      <input type="checkbox" name="featureIds" value={f.id} defaultChecked={selectedFeatureIds.includes(f.id)} className="size-4 rounded border-border" />
                      {f.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsPanel>

        <TabsPanel value="images" data-step="images">
          <div className="space-y-6">
            <div>
              <L label="Vehicle Images"><span className="text-xs text-muted-foreground mb-2 block">Upload photos of the vehicle. Set one as the cover image.</span></L>
              <ImageUpload initialImages={initialImages} />
            </div>
            <hr className="border-border" />
            <div className="space-y-4">
              <L label="Description"><textarea name="description" defaultValue={v.description ?? ""} rows={5} className={inputCls} placeholder="Write a compelling description for this vehicle..." /></L>
              <L label="Dealer notes (internal)"><textarea name="dealerNotes" defaultValue={v.dealer_notes ?? ""} rows={2} className={inputCls} placeholder="Private notes, e.g. trade-in details or reconditioning costs..." /></L>
            </div>
          </div>
        </TabsPanel>
      </Tabs>

      {/* Status messages */}
      {state?.error ? <p className="rounded-lg bg-danger/5 border border-danger/30 px-4 py-2.5 text-sm text-danger">{state.error}</p> : null}
      {state?.ok ? <p className="rounded-lg bg-success/5 border border-success/30 px-4 py-2.5 text-sm text-success">Saved successfully.</p> : null}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-3">
          {mode === "create" && !isFirst && (
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="size-4" /> Back
            </button>
          )}
          
          {mode === "edit" && (
            <button
              type="button"
              onClick={async () => {
                if (confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) {
                  const { deleteVehicle } = await import("@/app/admin/inventory/actions");
                  await deleteVehicle(v.id);
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-danger/40 bg-card px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
            >
              Delete vehicle
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Step counter for create mode */}
          {mode === "create" && (
            <span className="text-xs text-muted-foreground">
              Step {currentIndex + 1} of {STEPS.length}
            </span>
          )}

          {/* Next button (all steps except last in create mode) */}
          {mode === "create" && !isLast && (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm"
            >
              Next <ChevronRight className="size-4" />
            </button>
          )}

          {/* Submit — only on last step in create mode, always in edit mode */}
          {(mode === "edit" || isLast) && (
            <button
              type="submit"
              disabled={pending || isCreatingInline}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60 transition-colors shadow-sm"
            >
              {pending ? (
                <><Loader2 className="size-4 animate-spin" /> Saving…</>
              ) : mode === "create" ? (
                <><CheckIcon className="size-4" /> Create vehicle</>
              ) : (
                "Save changes"
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">{label}</span>{children}</label>;
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-body">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 rounded border-border" />
      {label}
    </label>
  );
}

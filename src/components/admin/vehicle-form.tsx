"use client";

import { useActionState, useState } from "react";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { fuelTypes, transmissionTypes, bodyTypes, driveTypes, vehicleStatuses } from "@/lib/validation/vehicle";
import { FUEL_LABELS, TRANSMISSION_LABELS, BODY_TYPE_LABELS, DRIVE_LABELS } from "@/lib/nav";
import type { Make, Model, Feature, LocationBranch, FeatureCategory } from "@/lib/domain";

type ActionResult = { ok?: boolean; error?: string } | void;
type Action = (state: ActionResult, formData: FormData) => Promise<ActionResult>;

const inputCls = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground";

// A vehicle row (snake_case) for edit mode, loosely typed.
type VehicleData = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function VehicleForm({
  action,
  makes,
  models,
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
  const [makeId, setMakeId] = useState<string>(vehicle?.make_id ?? "");
  const v = vehicle ?? {};
  const modelsForMake = models.filter((m) => m.makeId === makeId);
  const featureGroups = (["comfort", "safety", "technology", "exterior"] as FeatureCategory[])
    .map((cat) => ({ cat, items: features.filter((f) => f.category === cat) }));

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" ? <input type="hidden" name="id" value={v.id} /> : null}

      <Tabs defaultValue="basics">
        <TabsList>
          <TabsTab value="basics">Basics</TabsTab>
          <TabsTab value="specs">Specs</TabsTab>
          <TabsTab value="pricing">Pricing</TabsTab>
          <TabsTab value="features">Features</TabsTab>
          <TabsTab value="seo">SEO & Notes</TabsTab>
        </TabsList>

        <TabsPanel value="basics">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <L label="Stock ID *"><input name="stockId" required defaultValue={v.stock_id} disabled={mode === "edit"} className={inputCls} placeholder="A1042" /></L>
            <L label="Year *"><input name="year" required type="number" defaultValue={v.year} className={inputCls} /></L>
            <L label="Make *">
              <select name="makeId" required value={makeId} onChange={(e) => setMakeId(e.target.value)} className={inputCls}>
                <option value="">Select make…</option>
                {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </L>
            <L label="Model *">
              <select name="modelId" required defaultValue={v.model_id} className={inputCls} disabled={!makeId}>
                <option value="">Select model…</option>
                {modelsForMake.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </L>
            <L label="Variant"><input name="variant" defaultValue={v.variant ?? ""} className={inputCls} placeholder="GXL" /></L>
            <L label="Mileage (km) *"><input name="mileageKm" required type="number" defaultValue={v.mileage_km} className={inputCls} /></L>
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

        <TabsPanel value="specs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <L label="Fuel *"><select name="fuelType" required defaultValue={v.fuel_type ?? fuelTypes[0]} className={inputCls}>{fuelTypes.map((f) => <option key={f} value={f}>{FUEL_LABELS[f]}</option>)}</select></L>
            <L label="Transmission *"><select name="transmission" required defaultValue={v.transmission ?? transmissionTypes[0]} className={inputCls}>{transmissionTypes.map((t) => <option key={t} value={t}>{TRANSMISSION_LABELS[t]}</option>)}</select></L>
            <L label="Body type *"><select name="bodyType" required defaultValue={v.body_type ?? bodyTypes[0]} className={inputCls}>{bodyTypes.map((b) => <option key={b} value={b}>{BODY_TYPE_LABELS[b]}</option>)}</select></L>
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

        <TabsPanel value="pricing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <L label="Price ($) *"><input name="price" required type="number" step="0.01" defaultValue={v.price} className={inputCls} /></L>
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

        <TabsPanel value="features">
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

        <TabsPanel value="seo">
          <div className="space-y-4">
            <L label="Description"><textarea name="description" defaultValue={v.description ?? ""} rows={5} className={inputCls} /></L>
            <L label="SEO title"><input name="seoTitle" defaultValue={v.seo_title ?? ""} className={inputCls} /></L>
            <L label="SEO description"><textarea name="seoDescription" defaultValue={v.seo_description ?? ""} rows={2} className={inputCls} /></L>
            <L label="Dealer notes (internal)"><textarea name="dealerNotes" defaultValue={v.dealer_notes ?? ""} rows={2} className={inputCls} /></L>
          </div>
        </TabsPanel>
      </Tabs>

      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-success">Saved.</p> : null}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
          {pending ? "Saving…" : mode === "create" ? "Create vehicle" : "Save changes"}
        </button>
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronDown } from "lucide-react";
import { LocationAutocomplete } from "./LocationAutocomplete";

const categories = [
  { value: "", label: "All Categories" },
  { value: "Sedan", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "People mover", label: "People Mover" },
  { value: "Van", label: "Van" },
  { value: "Ute", label: "Ute" },
  { value: "Luxury", label: "Luxury" },
];

interface SearchWidgetProps {
  variant?: "hero" | "compact" | "sidebar";
  className?: string;
  onSubmit?: () => void;
}

export function SearchWidget({ variant = "hero", className = "", onSubmit }: SearchWidgetProps) {
  const [location, setLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [category, setCategory] = useState("");

  const isHero = variant === "hero";
  const isCompact = variant === "compact";

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (location) params.set("city", location);
    if (category) params.set("category", category);
    if (pickupDate) params.set("pickup", pickupDate);
    if (returnDate) params.set("return", returnDate);
    return `/search?${params.toString()}`;
  };

  const handleSubmit = () => {
    if (onSubmit) onSubmit();
  };

  if (isHero) {
    return (
      <div className={`${className} relative w-full max-w-5xl mx-auto`}>
        {/* Mobile View: Inline stacked search card (standard car-rental pattern) */}
        <div className="md:hidden w-full px-4">
          <div className="bg-white p-4 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)] rounded-2xl flex flex-col gap-3 border border-slate-100">
            {/* Where */}
            <div className="w-full bg-slate-50 relative px-4 py-2.5 rounded-xl border border-slate-200 focus-within:border-primary focus-within:bg-white transition-colors">
              <label className="block text-[11px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">
                Where
              </label>
              <LocationAutocomplete
                onSelect={(res) => {
                  if (res?.features?.[0]?.properties?.name) {
                    setLocation(res.features[0].properties.name);
                  }
                }}
                placeholder={location || "City or airport"}
                hideIcon={true}
                inputClassName="w-full bg-transparent border-none p-0 focus:ring-0 text-base text-slate-900 font-semibold placeholder:text-slate-400 outline-none truncate"
              />
            </div>

            {/* Dates */}
            <div className="flex flex-row gap-3 w-full">
              <div className="flex-1 min-w-0 bg-slate-50 relative px-4 py-2.5 rounded-xl border border-slate-200 focus-within:border-primary focus-within:bg-white transition-colors">
                <label className="block text-[11px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">
                  Pickup
                </label>
                <input
                  type={pickupDate ? "date" : "text"}
                  placeholder="Add date"
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-base text-slate-900 font-semibold outline-none appearance-none placeholder:text-slate-400"
                />
              </div>
              <div className="flex-1 min-w-0 bg-slate-50 relative px-4 py-2.5 rounded-xl border border-slate-200 focus-within:border-primary focus-within:bg-white transition-colors">
                <label className="block text-[11px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">
                  Return
                </label>
                <input
                  type={returnDate ? "date" : "text"}
                  placeholder="Add date"
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={pickupDate || new Date().toISOString().split("T")[0]}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-base text-slate-900 font-semibold outline-none appearance-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Search button */}
            <Link
              href={buildSearchUrl()}
              onClick={handleSubmit}
              className="flex items-center justify-center gap-2 bg-gradient-to-br from-[#ea580c] to-[#c2410c] hover:from-[#f97316] hover:to-[#ea580c] text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all w-full"
            >
              <Search className="h-5 w-5" strokeWidth={2.5} />
              Search
            </Link>
          </div>
        </div>

        {/* Desktop View: Premium Seamless Glass Pill */}
        <div className="hidden md:flex bg-white/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] rounded-full h-[76px] flex-row items-center divide-x divide-slate-200/60 border border-white backdrop-blur-3xl transition-shadow hover:shadow-[0_25px_65px_-15px_rgba(0,0,0,0.2)]">
          
          {/* Location Segment */}
          <div className="flex-[1.2] h-full flex flex-col justify-center px-8 hover:bg-slate-100/50 focus-within:bg-slate-100/80 rounded-l-full transition-colors cursor-text group relative">
            <label className="text-[10px] font-black tracking-[0.15em] text-slate-800 uppercase mb-0.5 group-focus-within:text-orange-600 transition-colors">
              Where
            </label>
            <LocationAutocomplete 
              onSelect={(res) => {
                if (res?.features?.[0]?.properties?.name) {
                  setLocation(res.features[0].properties.name);
                }
              }} 
              placeholder="City or airport"
              hideIcon={true}
              inputClassName="w-full bg-transparent border-none p-0 focus:ring-0 text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none truncate"
            />
          </div>

          {/* Date Segment Wrapper */}
          <div className="flex-[1.5] h-full flex flex-row divide-x divide-slate-200/60">
            {/* Pickup Date Segment */}
            <div className="flex-1 h-full flex flex-col justify-center px-6 hover:bg-slate-100/50 focus-within:bg-slate-100/80 transition-colors cursor-text group">
              <label className="text-[10px] font-black tracking-[0.15em] text-slate-800 uppercase mb-0.5 group-focus-within:text-orange-600 transition-colors">
                Pickup
              </label>
              <input
                suppressHydrationWarning
                type={pickupDate ? "date" : "text"}
                placeholder="Add date"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none appearance-none"
              />
            </div>

            {/* Return Date Segment */}
            <div className="flex-1 h-full flex flex-col justify-center px-6 hover:bg-slate-100/50 focus-within:bg-slate-100/80 transition-colors cursor-text group">
              <label className="text-[10px] font-black tracking-[0.15em] text-slate-800 uppercase mb-0.5 group-focus-within:text-orange-600 transition-colors">
                Return
              </label>
              <input
                suppressHydrationWarning
                type={returnDate ? "date" : "text"}
                placeholder="Add date"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={pickupDate || new Date().toISOString().split("T")[0]}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none appearance-none"
              />
            </div>
          </div>

          {/* Vehicle Type Segment & Search Button Wrapper */}
          <div className="flex-[1.2] h-full flex flex-row items-center justify-between pl-6 pr-2 hover:bg-slate-100/50 focus-within:bg-slate-100/80 rounded-r-full transition-colors group">
            <div className="flex-1 flex flex-col justify-center cursor-pointer relative pr-4">
              <label className="text-[10px] font-black tracking-[0.15em] text-slate-800 uppercase mb-0.5 group-focus-within:text-orange-600 transition-colors">
                Vehicle
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none pr-6 appearance-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label || "Any type"}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Search Button */}
            <Link
              href={buildSearchUrl()}
              onClick={handleSubmit}
              className="shrink-0 flex items-center justify-center gap-2 bg-gradient-to-br from-[#ea580c] to-[#c2410c] hover:from-[#f97316] hover:to-[#ea580c] text-white font-bold h-14 px-7 rounded-full shadow-[0_8px_20px_-6px_rgba(234,88,12,0.6)] hover:shadow-[0_12px_25px_-6px_rgba(234,88,12,0.7)] hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all"
            >
              <Search className="h-5 w-5" strokeWidth={3} />
              <span className="hidden lg:inline text-[15px]">Search</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Compact or Sidebar Variant
  return (
    <div className={`${className}`}>
      {/* COMPACT DESKTOP (Professional Seamless Pill) */}
      {isCompact && (
        <div className="hidden md:flex bg-white shadow-sm border border-slate-300 rounded-full h-[60px] w-full max-w-4xl flex-row items-center divide-x divide-slate-200 hover:shadow-md transition-shadow">
          <div className="flex-1 px-6 h-full flex flex-col justify-center focus-within:bg-slate-50/80 hover:bg-slate-50/50 rounded-l-full group transition-colors cursor-text">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Where</label>
            <LocationAutocomplete 
              onSelect={(res) => {
                if (res?.features?.[0]?.properties?.name) {
                  setLocation(res.features[0].properties.name);
                }
              }} 
              placeholder={location || "City or airport"} 
              hideIcon={true}
              inputClassName="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900 font-semibold placeholder:text-slate-400 outline-none truncate"
            />
          </div>
          
          <div className="flex-[0.7] px-6 h-full flex flex-col justify-center focus-within:bg-slate-50/80 hover:bg-slate-50/50 transition-colors cursor-text">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Pickup</label>
            <input
              type={pickupDate ? "date" : "text"}
              placeholder="Add date"
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900 font-semibold outline-none appearance-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex-[0.7] px-6 h-full flex flex-col justify-center focus-within:bg-slate-50/80 hover:bg-slate-50/50 transition-colors cursor-text">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Return</label>
            <input
              type={returnDate ? "date" : "text"}
              placeholder="Add date"
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={pickupDate || new Date().toISOString().split("T")[0]}
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900 font-semibold outline-none appearance-none placeholder:text-slate-400"
            />
          </div>

          <div className="pr-2 pl-4 h-full flex items-center justify-center">
            <Link
              href={buildSearchUrl()}
              onClick={handleSubmit}
              className="flex items-center justify-center bg-[#ea580c] hover:bg-[#c2410c] text-white h-11 w-11 rounded-full transition-colors"
            >
              <Search className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      )}

      {/* COMPACT MOBILE & SIDEBAR (Stacked View) */}
      <div className={`
        ${isCompact ? "md:hidden bg-white p-4 shadow-xl rounded-2xl flex flex-col gap-4" : ""}
        ${variant === "sidebar" ? "bg-white p-6 shadow-xl rounded-2xl flex flex-col gap-4" : ""}
      `}>
        <div className="flex-1 w-full bg-slate-50 relative px-4 py-3 rounded-xl border border-slate-200 focus-within:border-primary transition-colors">
          <label className="block text-xs font-bold text-slate-500 mb-1">
            WHERE
          </label>
          <LocationAutocomplete 
            onSelect={(res) => {
              if (res?.features?.[0]?.properties?.name) {
                setLocation(res.features[0].properties.name);
              }
            }} 
            placeholder={location || "City or airport"} 
            hideIcon={true}
            inputClassName="w-full bg-transparent border-none p-0 focus:ring-0 text-base md:text-sm text-slate-900 font-medium placeholder:text-slate-400 outline-none"
          />
        </div>

        <div className="flex flex-row gap-4 w-full">
          <div className="flex-1 w-full bg-slate-50 relative px-4 py-3 rounded-xl border border-slate-200 focus-within:border-primary transition-colors">
            <label className="block text-xs font-bold text-slate-500 mb-1">
              PICKUP
            </label>
            <input
              type={pickupDate ? "date" : "text"}
              placeholder="Add date"
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-base md:text-sm text-slate-900 font-medium outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex-1 w-full bg-slate-50 relative px-4 py-3 rounded-xl border border-slate-200 focus-within:border-primary transition-colors">
            <label className="block text-xs font-bold text-slate-500 mb-1">
              RETURN
            </label>
            <input
              type={returnDate ? "date" : "text"}
              placeholder="Add date"
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-base md:text-sm text-slate-900 font-medium outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <Link
          href={buildSearchUrl()}
          onClick={handleSubmit}
          className="flex items-center justify-center bg-[#ea580c] hover:bg-[#c2410c] text-white px-8 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all w-full"
        >
          {variant === "sidebar" ? "Search" : <Search className="h-5 w-5" />}
        </Link>
      </div>
    </div>
  );
}
"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";

type PhotonFeature = {
  properties: {
    name?: string;
    state?: string;
    country?: string;
    city?: string;
    osm_value?: string;
  };
};

type LocationSelectPayload = {
  features: Array<{ properties: { name: string } }>;
};

interface LocationAutocompleteProps {
  onSelect: (location: LocationSelectPayload) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  hideIcon?: boolean;
}

export function LocationAutocomplete({ onSelect, placeholder = "City or airport", className, inputClassName, hideIcon }: LocationAutocompleteProps) {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Only search if user has typed at least 2 characters
    if (!value || value.length < 2) {
      // Use a timeout of 0 to avoid calling setState synchronously in an effect body,
      // which would trigger a cascading render on every character typed below threshold.
      const id = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(id);
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Proxy through our own API route to avoid browser CORS restrictions
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}&limit=5`);
        const data = await res.json() as { features?: PhotonFeature[] };
        setResults(data.features || []);
      } catch (error) {
        console.error("Error fetching locations from Photon:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [value]);

  return (
    <div ref={wrapperRef} className={`relative flex items-center w-full ${className || ""}`}>
      {!hideIcon && (
        <div className="absolute left-3 z-10 text-amber-500 pointer-events-none">
          <MapPin className="h-5 w-5" />
        </div>
      )}
      <div className="w-full">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={inputClassName || "w-full rounded-xl border-2 border-transparent bg-white/80 hover:bg-white pl-11 pr-10 py-3.5 text-base md:text-sm font-medium text-slate-900 shadow-sm focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute top-[calc(100%+8px)] left-0 right-0 max-h-64 overflow-auto rounded-xl bg-white shadow-2xl border border-slate-100 z-50 py-2 animate-in fade-in slide-in-from-top-2">
          {results.map((item, index) => {
            const props = item.properties;
            // Build a descriptive sub-label. e.g. "Suburb • Sydney, New South Wales"
            const typeLabel = props.osm_value ? props.osm_value.charAt(0).toUpperCase() + props.osm_value.slice(1) : "";
            
            // Avoid duplicating name in the subtext
            const locationParts = [props.city !== props.name ? props.city : null, props.state]
              .filter(Boolean);
              
            const subtext = [typeLabel, locationParts.join(", ")].filter(Boolean).join(" • ");
            const displayName = [props.name, props.city, props.state].filter(Boolean).join(", ");

            return (
              <li
                key={index}
                onClick={() => {
                  setValue(props.name || displayName);
                  setIsOpen(false);
                  onSelect({ features: [{ properties: { name: props.name || displayName } }] });
                }}
                className="cursor-pointer px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors flex flex-col gap-0.5 border-b border-slate-50 last:border-0"
              >
                <span className="font-semibold text-slate-900">{props.name}</span>
                {subtext && (
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                    {subtext}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

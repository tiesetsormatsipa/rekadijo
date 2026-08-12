"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MapPin, Navigation, ChevronDown, AlertTriangle, Search, Check, Plus } from "lucide-react";
import { useAddressStore, shortenAddress } from "@/lib/address-store";
import { haversineDistanceKm, estimateDeliveryFee } from "@/lib/geo";
import { formatZAR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type ResolvedDelivery =
  | { inRange: true; lat: number; lng: number; label: string; distanceKm: number; fee: number }
  | { inRange: false; lat: number; lng: number; label: string; distanceKm: number }
  | null;

interface AddressSelectorProps {
  branchLat?: number;
  branchLng?: number;
  deliveryRadiusKm?: number | null;
  onResolved?: (result: ResolvedDelivery) => void;
}

export function AddressSelector({
  branchLat,
  branchLng,
  deliveryRadiusKm,
  onResolved
}: AddressSelectorProps) {
  const {
    addresses,
    selected,
    locating,
    selectAddress,
    useCurrentLocation: requestCurrentLocation,
    addAndSelectAddress
  } = useAddressStore();
  const [open, setOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Clean Outside Click Handler to close dropdown naturally
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Google Places Autocomplete when dropdown opens
  useEffect(() => {
    if (!open || !autocompleteInputRef.current || typeof window === "undefined" || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
      componentRestrictions: { country: "za" },
      fields: ["address_components", "geometry", "formatted_address", "name"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        toast.error("No location data found for this address.");
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const formattedAddress = place.formatted_address || "";
      
      const cityComponent = place.address_components?.find((c) => 
        c.types.includes("locality") || c.types.includes("administrative_area_level_2")
      );
      const city = cityComponent ? cityComponent.long_name : "Unknown City";

      addAndSelectAddress({
        label: place.name || "Searched Location",
        addressLine: formattedAddress,
        city,
        latitude: lat,
        longitude: lng,
      });

      setSearchQuery("");
      setOpen(false);
    });
  }, [open, addAndSelectAddress]);

  // Compute distance calculation context only if branch parameters are supplied
  const resolved = useMemo<ResolvedDelivery>(() => {
    if (!selected || selected.lat == null || selected.lng == null || branchLat == null || branchLng == null) {
      return null;
    }
    
    const distanceKm = haversineDistanceKm(
      { lat: branchLat, lng: branchLng }, 
      { lat: selected.lat, lng: selected.lng }
    );
    const radius = deliveryRadiusKm ?? Infinity;
    
    if (distanceKm > radius) {
      return { inRange: false, lat: selected.lat, lng: selected.lng, label: selected.label, distanceKm };
    }
    
    return {
      inRange: true,
      lat: selected.lat,
      lng: selected.lng,
      label: selected.label,
      distanceKm,
      fee: estimateDeliveryFee(distanceKm)
    };
  }, [selected, branchLat, branchLng, deliveryRadiusKm]);

  // SAFELY execute state callback transitions with optional chaining (?.)
  useEffect(() => {
    if (onResolved) {
      onResolved(resolved);
    }
  }, [resolved, onResolved]);

  // Check if component is rendering inside Header Navigation Bar context or standard view
  const isGlobalHeader = branchLat == null;

  return (
    <div ref={dropdownRef} className="relative inline-block w-full text-left z-50">
      {!isGlobalHeader && (
        <label className="block text-xs font-medium text-charcoal-600 mb-1">
          Delivery address
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center justify-between gap-2 border transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 bg-white",
          isGlobalHeader 
            ? "rounded-full border-charcoal-200 px-3 py-1.5 text-xs font-medium text-charcoal-700 shadow-sm hover:bg-charcoal-50 hover:border-charcoal-300"
            : "w-full rounded-lg border-charcoal-200 px-3 py-2 text-sm text-charcoal-800 shadow-sm"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <MapPin className={cn("flex-none", isGlobalHeader ? "h-3.5 w-3.5 text-amber-600" : "h-4 w-4 text-charcoal-400")} />
          {selected ? (
            <span className={cn("truncate", isGlobalHeader ? "max-w-[140px] sm:max-w-[200px]" : "")}>
              {selected.shortLabel}
            </span>
          ) : (
            <span className="text-charcoal-400">Choose an address</span>
          )}
        </span>
        <ChevronDown className={cn("flex-none text-charcoal-400 transition-transform duration-200", open && "rotate-180", isGlobalHeader ? "h-3 w-3" : "h-4 w-4")} />
      </button>

      {open && (
        <div className={cn(
          "absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl border border-charcoal-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150 max-h-96 overflow-y-auto",
          isGlobalHeader ? "sm:left-auto sm:right-0 sm:origin-top-right" : "right-0"
        )}>
          
          {/* Real Map Autocomplete Input Field Context */}
          <div className="relative mb-2 mt-1 px-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
            <input
              ref={autocompleteInputRef}
              type="text"
              placeholder="Search real map address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-charcoal-200 bg-charcoal-50 py-1.5 pl-9 pr-3 text-sm focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Browser Geolocation GPS Trigger */}
          <button
            type="button"
            disabled={locating}
            onClick={async () => {
              try {
                await requestCurrentLocation();
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Couldn't get your location.");
              }
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs font-medium text-amber-600 hover:bg-amber-50 transition border-b border-charcoal-100/80 pb-2 mb-1"
          >
            <Navigation className={cn("h-3.5 w-3.5", locating && "animate-spin")} />
            <span className="truncate">
              {locating ? "Finding you..." : "Use current GPS location"}
            </span>
          </button>

          {/* Dynamic Address Profiles Rendering Engine List */}
          {addresses.length > 0 && (
            <div className="max-h-[180px] overflow-y-auto pr-0.5">
              {addresses.map((a) => {
                const isSelected = selected?.kind === "address" && selected.addressId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      selectAddress(a);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left text-xs transition mt-0.5",
                      isSelected ? "bg-amber-50/60 text-charcoal-900 font-medium" : "text-charcoal-600 hover:bg-charcoal-50"
                    )}
                  >
                    <MapPin className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", isSelected ? "text-amber-600" : "text-charcoal-400")} />
                    <div className="truncate flex-1">
                      <span className="block font-semibold text-charcoal-800">{a.label}</span>
                      <span className="block text-[11px] text-charcoal-500 mt-0.5 truncate">
                        {shortenAddress(a.addressLine)}, {a.city}
                      </span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-amber-600 self-center shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Core Route Panel Redirection Anchor Link */}
          <div className="mt-1 border-t border-charcoal-100 pt-1">
            <Link
              href="/dashboard/buyer/profile"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-charcoal-500 hover:bg-charcoal-50 hover:text-charcoal-800 transition"
            >
              <Plus className="h-3.5 w-3.5 text-charcoal-400" />
              Manage delivery profiles
            </Link>
          </div>
        </div>
      )}

      {/* Render Radius feedback context indicators only when looking at a vendor detail viewport page */}
      {!isGlobalHeader && resolved && resolved.inRange && (
        <p className="mt-1.5 text-xs text-olive-700">
          {resolved.distanceKm.toFixed(1)} km away · delivery fee {formatZAR(resolved.fee)}
        </p>
      )}
      {!isGlobalHeader && resolved && !resolved.inRange && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertTriangle className="h-3.5 w-3.5" />
          {resolved.distanceKm.toFixed(1)} km away — outside this branch&apos;s {deliveryRadiusKm}km delivery range.
        </p>
      )}
      {!isGlobalHeader && !selected && (
        <p className="mt-1.5 text-xs text-charcoal-400">Choose an address so we can confirm delivery is available.</p>
      )}
      {!isGlobalHeader && selected && addresses.length > 0 && (
        <p className="mt-1.5 text-xs text-charcoal-400">
          Reusing your saved address profile. Open the selector to switch or manage addresses.
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown, MapPin, Navigation, Plus, Truck, ShoppingBag } from "lucide-react";
import { useAddressStore, shortenAddress } from "@/lib/address-store";
import { cn } from "@/lib/utils";

export function AddressBar() {
  const {
    addresses,
    selected,
    mode,
    locating,
    setMode,
    selectAddress,
    useCurrentLocation: requestCurrentLocation
  } = useAddressStore();
  const [open, setOpen] = useState(false);

  const label = selected?.shortLabel ?? "Set your location";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-left hover:bg-charcoal-100 focus-ring"
      >
        <MapPin className="h-4 w-4 flex-none text-amber-600" />
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-charcoal-800 sm:inline">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-charcoal-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-2 w-80 rounded-2xl border border-charcoal-100 bg-white p-3 shadow-cardHover">
            {/* Delivery / Pickup toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-full bg-charcoal-50 p-1">
              <button
                onClick={() => setMode("DELIVERY")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition",
                  mode === "DELIVERY" ? "bg-charcoal-800 text-cream-100" : "text-charcoal-500"
                )}
              >
                <Truck className="h-3.5 w-3.5" /> Delivery
              </button>
              <button
                onClick={() => setMode("PICKUP")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition",
                  mode === "PICKUP" ? "bg-charcoal-800 text-cream-100" : "text-charcoal-500"
                )}
              >
                <ShoppingBag className="h-3.5 w-3.5" /> Pickup
              </button>
            </div>

            <button
              onClick={async () => {
                try {
                  await requestCurrentLocation();
                  toast.success("Using your current location.");
                  setOpen(false);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Couldn't get your location.");
                }
              }}
              disabled={locating}
              className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-charcoal-800 hover:bg-charcoal-50 disabled:opacity-50"
            >
              <Navigation className="h-4 w-4 text-amber-600" />
              {locating ? "Finding you..." : "Use current location"}
            </button>

            {addresses.length > 0 && (
              <div className="mt-1 max-h-48 overflow-y-auto">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      selectAddress(a);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-charcoal-50",
                      selected?.kind === "address" && selected.addressId === a.id && "bg-amber-50"
                    )}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 flex-none text-charcoal-400" />
                    <span>
                      <span className="block font-medium text-charcoal-800">{a.label}</span>
                      <span className="block text-xs text-charcoal-500">
                        {shortenAddress(a.addressLine)}, {a.city}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <Link
              href="/dashboard/buyer/profile"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-700 hover:bg-charcoal-50"
            >
              <Plus className="h-4 w-4" /> Add a new address
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

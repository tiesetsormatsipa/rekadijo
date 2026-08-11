"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Star, MapPin, Navigation } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { useAddressStore } from "@/lib/address-store";
import { haversineDistanceKm } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type { MapBranch } from "@/components/vendor-map";

interface ExtendedMapBranch extends MapBranch {
  products?: {
    name: string;
    description: string;
   }[];
}

const VendorMap = dynamic(() => import("@/components/vendor-map").then((m) => m.VendorMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-50 text-sm font-medium text-gray-500">
      Loading interface maps...
    </div>
  )
});

export function MapPageClient({ branches, initialQuery }: { branches: ExtendedMapBranch[]; initialQuery: string }) {
  const { selected, mode, setMode } = useAddressStore();
  
  const [query, setQuery] = useState(initialQuery.toLowerCase());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  
  // High-Fidelity Fluid Bottom Sheet State
  const [currentTop, setCurrentTop] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sheetState, setSheetState] = useState<"peek" | "mid" | "full">("mid");
  
  const dragStartY = useRef(0);
  const dragStartTop = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // FIXED: Stabilized reference to prevent heavy dependency-array cascading during drags
  const userLocation = useMemo(() => {
    return selected && selected.lat != null && selected.lng != null 
      ? { lat: selected.lat, lng: selected.lng } 
      : null;
  }, [selected]);

  // Calculate boundary limits based on viewport height
  const getBreakpoints = () => {
    if (typeof window === "undefined") return { full: 60, mid: 500, peek: 700 };
    const h = window.innerHeight;
    return {
      full: 80,             // Maximum top limit (80px from top)
      mid: h * 0.70,        // Default startup point (30% visual height)
      peek: h - 90          // Minimum bottom limit (just the handle bar visible)
    };
  };

  // Set initial position on mount
  useEffect(() => {
    const bps = getBreakpoints();
    setCurrentTop(bps.mid);
  }, []);

  // Gracefully handle screen resizing or rotation without breaking layout bounds
  useEffect(() => {
    const handleResize = () => {
      const bps = getBreakpoints();
      setCurrentTop((prev) => {
        if (prev === null) return bps.mid;
        // Keep current custom position clamped safely inside the new screen limits
        return Math.max(bps.full, Math.min(bps.peek, prev));
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filtered = useMemo(() => {
    const withDistance = branches
      .filter((b) => {
        if (!query) return true;
        const matchesBusiness = b.businessName.toLowerCase().includes(query) || b.category.toLowerCase().includes(query);
        const matchesProducts = b.products?.some(
          (product) => product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)
        ) ?? false;
        return matchesBusiness || matchesProducts;
      })
      .map((b) => ({
        ...b,
        distanceKm: userLocation ? haversineDistanceKm(userLocation, { lat: b.lat, lng: b.lng }) : null
      }));
    return withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [branches, query, userLocation]);

  // Pointer Event Logic for Fluid Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".drag-handle-zone")) return;

    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartTop.current = currentTop ?? getBreakpoints().mid;
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartY.current;
    const bps = getBreakpoints();
    
    const targetTop = dragStartTop.current + deltaY;
    const clampedTop = Math.max(bps.full, Math.min(bps.peek, targetTop));
    setCurrentTop(clampedTop);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const bps = getBreakpoints();
    const current = currentTop ?? bps.mid;

    // If close to absolute boundaries, clean lock them. Otherwise, let it rest exactly where dropped.
    if (current <= bps.full + 4) {
      setSheetState("full");
      setCurrentTop(bps.full);
    } else if (current >= bps.peek - 4) {
      setSheetState("peek");
      setCurrentTop(bps.peek);
    } else {
      setSheetState("mid"); // Tracks that it's in a free-floating flexible state
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full flex-col bg-gray-50 font-sans antialiased overflow-hidden select-none">
      
      {/* 1. LAYER BASE: THE MAP CANVAS */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <VendorMap branches={filtered} userLocation={userLocation} focusedBranchId={focusedId} />
      </div>

      {/* 2. OVERLAY HEADER NAVIGATION BAR */}
      <div className="pointer-events-none fixed top-16 left-0 right-0 z-20 w-full p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          
          <div className="pointer-events-auto w-full min-w-[280px] flex-1 shadow-md sm:max-w-md bg-white rounded-xl border border-gray-100 p-0.5">
            <SearchBar
              initialQuery={query}
              placeholder="Food, groceries, drinks..."
              className="w-full"
              inputClassName="border-0 bg-transparent shadow-none focus-visible:ring-0 h-11"
              onChange={(val) => setQuery(val.toLowerCase())}
            />
          </div>
          
          <div className="pointer-events-auto flex rounded-full bg-white p-1 shadow-md border border-gray-100 ml-auto sm:ml-0">
            <button
              onClick={() => setMode("DELIVERY")}
              className={cn(
                "rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all",
                mode === "DELIVERY" ? "bg-black text-white" : "text-gray-600 hover:text-black"
              )}
            >
              Delivery
            </button>
            <button
              onClick={() => setMode("PICKUP")}
              className={cn(
                "rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all",
                mode === "PICKUP" ? "bg-black text-white" : "text-gray-600 hover:text-black"
              )}
            >
              Pickup
            </button>
          </div>
        </div>
      </div>

      {/* 3. DESKTOP PERMANENT FLOATING SIDEBAR */}
      <div className="pointer-events-none fixed bottom-6 top-40 left-6 z-10 hidden w-[380px] flex-col sm:flex">
        <div className="pointer-events-auto flex max-h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          
          <div className="border-b border-gray-100 px-5 py-4 bg-white shrink-0">
            <h1 className="text-base font-bold text-gray-900">
              {query ? "Search Results" : "Nearby Stores"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} options open to you</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 no-scrollbar pb-12">
            {filtered.map((b) => (
              <div
                key={b.id}
                onMouseEnter={() => setFocusedId(b.id)}
                onClick={() => setFocusedId(b.id)}
                className={cn(
                  "relative block w-full p-5 text-left transition-colors cursor-pointer",
                  focusedId === b.id ? "bg-gray-50" : "bg-white hover:bg-gray-50/40"
                )}
              >
                {focusedId === b.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-black" />}
                <h3 className="text-sm font-bold text-gray-900 leading-snug">{b.businessName}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{b.branchName} · {b.city}</span>
                </p>
                <div className="mt-2 flex items-center gap-x-2 text-xs font-medium">
                  <span className="flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">
                    <Star className="h-3 w-3 fill-emerald-700 text-emerald-700" />
                    {b.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-200">•</span>
                  <span className="text-gray-500 truncate max-w-[120px]">{b.category}</span>
                  {b.distanceKm != null && (
                    <>
                      <span className="text-gray-200">•</span>
                      <span className="text-gray-500 font-mono text-[11px]">{b.distanceKm.toFixed(1)}km</span>
                    </>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-2 text-[11px]">
                  <span className="text-gray-400">20–30 mins · $0.99 Fee</span>
                  <Link href={`/vendors/${b.businessSlug}`} className="font-bold text-black underline underline-offset-4">
                    View Menu
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. FREE-FORM DRAGGABLE BOTTOM SHEET (MOBILE OVERLAY) */}
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ 
          transform: currentTop !== null ? `translateY(${currentTop}px)` : "translateY(70vh)" 
        }}
        className={cn(
          "pointer-events-auto fixed inset-x-0 top-0 h-screen z-30 bg-white rounded-t-2xl shadow-[0_-10px_35px_-5px_rgba(0,0,0,0.15)] border-t border-gray-100 flex flex-col sm:hidden touch-none select-none",
          !isDragging && "transition-transform duration-200 ease-out"
        )}
      >
        {/* INTERACTIVE DRAG HANDLE ZONE */}
        <div className="drag-handle-zone w-full pt-3 pb-3 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shrink-0 border-b border-gray-50 bg-white rounded-t-2xl">
          <div className="w-12 h-1 rounded-full bg-gray-300 mb-2.5 shrink-0" />
          <div className="px-5 w-full flex items-center justify-between pointer-events-none">
            <h2 className="text-sm font-bold text-gray-900">
              {query ? "Search Results" : "Nearby Stores"}
            </h2>
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {filtered.length} locations
            </span>
          </div>
        </div>

        {/* SCROLLABLE INNER CARD PILE */}
        <div 
          ref={scrollContainerRef}
          className={cn(
            "flex-1 overflow-y-auto divide-y divide-gray-100 no-scrollbar pb-32 bg-white",
            sheetState === "full" ? "touch-pan-y pointer-events-auto" : "pointer-events-none overflow-hidden"
          )}
        >
          {filtered.map((b) => (
            <div
              key={b.id}
              onClick={() => setFocusedId(b.id)}
              className={cn(
                "w-full p-4.5 text-left flex flex-col gap-1 transition-colors pointer-events-auto",
                focusedId === b.id ? "bg-gray-50/80" : "bg-white"
              )}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{b.businessName}</h3>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{b.branchName} · {b.city}</p>
                </div>
                <span className="flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700 shrink-0">
                  <Star className="h-3 w-3 fill-emerald-700 text-emerald-700" />
                  {b.rating.toFixed(1)}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-gray-500">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-semibold text-gray-600">{b.category}</span>
                {b.distanceKm != null && (
                  <span className="text-gray-400 flex items-center gap-0.5 font-mono text-[11px]">
                    <Navigation className="h-2.5 w-2.5 transform rotate-45" />
                    {b.distanceKm.toFixed(1)} km
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-2.5 text-[11px]">
                <span className="text-gray-400 font-medium">15–25 min • $1.49 Delivery</span>
                <Link href={`/vendors/${b.businessSlug}`} className="font-bold text-black underline underline-offset-4">
                  Order Now
                </Link>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-12 text-center text-xs text-gray-400">No stores found inside this view bound.</div>
          )}
        </div>
      </div>

    </div>
  );
}

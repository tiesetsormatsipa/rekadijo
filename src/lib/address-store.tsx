"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type SavedAddressLite = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
};

export type SelectedLocation =
  | { kind: "address"; addressId: string; label: string; shortLabel: string; lat: number | null; lng: number | null }
  | { kind: "current"; label: string; shortLabel: string; lat: number; lng: number }
  | null;

type FulfillmentMode = "DELIVERY" | "PICKUP";

type AddressStore = {
  addresses: SavedAddressLite[];
  selected: SelectedLocation;
  mode: FulfillmentMode;
  locating: boolean;
  setMode: (mode: FulfillmentMode) => void;
  selectAddress: (address: SavedAddressLite) => void;
  addAndSelectAddress: (address: Omit<SavedAddressLite, "id" | "isDefault"> & { id?: string; isDefault?: boolean }) => void;
  useCurrentLocation: () => Promise<void>;
};

const AddressContext = createContext<AddressStore | null>(null);

const STORAGE_KEY = "rekadijo:selected-location";
const MODE_KEY = "rekadijo:fulfillment-mode";

export function shortenAddress(addressLine: string): string {
  const firstSegment = addressLine.split(",")[0]?.trim();
  return firstSegment || addressLine;
}

export function AddressProvider({
  children,
  initialAddresses
}: {
  children: React.ReactNode;
  initialAddresses: SavedAddressLite[];
}) {
  // 1. Keep addresses in state, but explicitly synchronized with incoming props
  const [addresses, setAddresses] = useState<SavedAddressLite[]>(initialAddresses);
  const [selected, setSelected] = useState<SelectedLocation>(null);
  const [mode, setModeState] = useState<FulfillmentMode>("DELIVERY");
  const [locating, setLocating] = useState(false);

  // Sync addresses state instantly whenever database props change (Crucial for adds & deletes)
  useEffect(() => {
    setAddresses(initialAddresses);
  }, [initialAddresses]);

  // 2. Load storage and sanitize dead caches
  useEffect(() => {
    try {
      const storedMode = localStorage.getItem(MODE_KEY);
      if (storedMode === "DELIVERY" || storedMode === "PICKUP") setModeState(storedMode);

      const storedSelection = localStorage.getItem(STORAGE_KEY);
      if (storedSelection) {
        const parsed = JSON.parse(storedSelection) as SelectedLocation;

        // If the cached address still exists in our current valid list, preserve it
        if (parsed?.kind === "address") {
          const stillExists = initialAddresses.some((a) => a.id === parsed.addressId);
          if (stillExists) {
            // Check if the current list updated which one is marked default
            setSelected(parsed);
            return;
          } else {
            // Clean out dead local storage reference if it was deleted from profile
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          setSelected(parsed);
          return;
        }
      }
    } catch {
      // ignore malformed storage
    }

    // Fallback: Default to whatever address is flagged isDefault, or fallback to the first element
    const defaultAddress = initialAddresses.find((a) => a.isDefault) ?? initialAddresses[0];
    if (defaultAddress) {
      setSelected({
        kind: "address",
        addressId: defaultAddress.id,
        label: `${defaultAddress.addressLine}, ${defaultAddress.city}`,
        shortLabel: shortenAddress(defaultAddress.addressLine),
        lat: defaultAddress.latitude,
        lng: defaultAddress.longitude
      });
    } else {
      setSelected(null);
    }
  }, [initialAddresses]);

  const setMode = useCallback((next: FulfillmentMode) => {
    setModeState(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const persistSelection = useCallback((next: SelectedLocation) => {
    setSelected(next);
    try {
      if (next) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const selectAddress = useCallback(
    (address: SavedAddressLite) => {
      persistSelection({
        kind: "address",
        addressId: address.id,
        label: `${address.addressLine}, ${address.city}`,
        shortLabel: shortenAddress(address.addressLine),
        lat: address.latitude,
        lng: address.longitude
      });
    },
    [persistSelection]
  );

  const addAndSelectAddress = useCallback(
    (address: Omit<SavedAddressLite, "id" | "isDefault"> & { id?: string; isDefault?: boolean }) => {
      const nextAddress: SavedAddressLite = {
        ...address,
        id: address.id ?? `local-${Date.now()}`,
        isDefault: address.isDefault ?? false
      };

      setAddresses((current) => {
        const existingIndex = current.findIndex((a) => a.id === nextAddress.id);
        if (existingIndex >= 0) {
          return current.map((a, index) => (index === existingIndex ? nextAddress : a));
        }
        return [nextAddress, ...current];
      });

      persistSelection({
        kind: "address",
        addressId: nextAddress.id,
        label: `${nextAddress.addressLine}, ${nextAddress.city}`,
        shortLabel: shortenAddress(nextAddress.addressLine),
        lat: nextAddress.latitude,
        lng: nextAddress.longitude
      });
    },
    [persistSelection]
  );

  const useCurrentLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      throw new Error("Location isn't available in this browser.");
    }
    setLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      persistSelection({
        kind: "current",
        label: "Current location",
        shortLabel: "Current location",
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } finally {
      setLocating(false);
    }
  }, [persistSelection]);

  const value = useMemo(
    () => ({ addresses, selected, mode, locating, setMode, selectAddress, addAndSelectAddress, useCurrentLocation }),
    [addresses, selected, mode, locating, setMode, selectAddress, addAndSelectAddress, useCurrentLocation]
  );

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddressStore() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddressStore must be used within AddressProvider");
  return ctx;
}

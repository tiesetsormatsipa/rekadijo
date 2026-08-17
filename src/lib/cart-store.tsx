"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { groupMenuOptions, resolveSelectedOptions } from "@/lib/menu-options";

export { groupMenuOptions, resolveSelectedOptions };

export type InstantCartLine = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  optionLabels?: string[];
};

export type QuotationCartLine = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  optionLabels?: string[];
};

type LegacyInstantCart = Record<string, number>;
type InstantCart = Record<string, InstantCartLine>;

type CartStorage = {
  instant: Record<string, InstantCart | LegacyInstantCart>;
  quotation: Record<string, Record<string, QuotationCartLine>>;
};

type CartStore = {
  hydrated: boolean;
  totalItemCount: number;
  getInstantCart: (businessId: string, branchId: string) => InstantCart;
  upsertInstantLine: (businessId: string, branchId: string, line: InstantCartLine) => void;
  updateInstantLineQty: (businessId: string, branchId: string, lineKey: string, delta: number) => void;
  clearInstantCart: (businessId: string, branchId: string) => void;
  getQuotationCart: (businessId: string, branchId: string) => Record<string, QuotationCartLine>;
  setQuotationCart: (businessId: string, branchId: string, cart: Record<string, QuotationCartLine>) => void;
  clearQuotationCart: (businessId: string, branchId: string) => void;
};

const STORAGE_KEY = "rekadijo:carts";

const CartContext = createContext<CartStore | null>(null);

export function instantLineKey(menuItemId: string, optionLabels?: string[]) {
  const labels = (optionLabels ?? []).slice().sort();
  return `${menuItemId}::${labels.join("|")}`;
}

function cartKey(businessId: string, branchId: string) {
  return `${businessId}:${branchId}`;
}

function emptyStorage(): CartStorage {
  return { instant: {}, quotation: {} };
}

function normalizeInstantCart(raw: InstantCart | LegacyInstantCart | undefined): InstantCart {
  if (!raw) return {};
  const firstValue = Object.values(raw)[0];
  if (typeof firstValue === "number") {
    const legacy = raw as LegacyInstantCart;
    const migrated: InstantCart = {};
    for (const [menuItemId, qty] of Object.entries(legacy)) {
      if (qty > 0) {
        const key = instantLineKey(menuItemId);
        migrated[key] = { menuItemId, name: "", unitPrice: 0, quantity: qty };
      }
    }
    return migrated;
  }
  return raw as InstantCart;
}

function loadStorage(): CartStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStorage();
    const parsed = JSON.parse(raw) as Partial<CartStorage>;
    const instant: CartStorage["instant"] = {};
    for (const [key, cart] of Object.entries(parsed.instant ?? {})) {
      instant[key] = normalizeInstantCart(cart);
    }
    return {
      instant,
      quotation: parsed.quotation ?? {}
    };
  } catch {
    return emptyStorage();
  }
}

function countItems(storage: CartStorage): number {
  let total = 0;
  for (const cart of Object.values(storage.instant)) {
    for (const line of Object.values(normalizeInstantCart(cart))) {
      if (line.quantity > 0) total += line.quantity;
    }
  }
  for (const cart of Object.values(storage.quotation)) {
    for (const line of Object.values(cart)) {
      if (line.quantity > 0) total += line.quantity;
    }
  }
  return total;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [storage, setStorage] = useState<CartStorage>(emptyStorage);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStorage(loadStorage());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: CartStorage) => {
    setStorage(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / private mode errors
    }
  }, []);

  const getInstantCart = useCallback(
    (businessId: string, branchId: string) => normalizeInstantCart(storage.instant[cartKey(businessId, branchId)]),
    [storage]
  );

  const upsertInstantLine = useCallback(
    (businessId: string, branchId: string, line: InstantCartLine) => {
      const vendorKey = cartKey(businessId, branchId);
      const current = normalizeInstantCart(storage.instant[vendorKey]);
      const lineKey = instantLineKey(line.menuItemId, line.optionLabels);
      const existing = current[lineKey];
      const nextCart: InstantCart = {
        ...current,
        [lineKey]: {
          ...line,
          quantity: (existing?.quantity ?? 0) + line.quantity
        }
      };
      const nextInstant = { ...storage.instant, [vendorKey]: nextCart };
      persist({ ...storage, instant: nextInstant });
    },
    [persist, storage]
  );

  const updateInstantLineQty = useCallback(
    (businessId: string, branchId: string, lineKey: string, delta: number) => {
      const vendorKey = cartKey(businessId, branchId);
      const current = normalizeInstantCart(storage.instant[vendorKey]);
      const existing = current[lineKey];
      if (!existing) return;
      const nextQty = existing.quantity + delta;
      const nextCart = { ...current };
      if (nextQty <= 0) {
        delete nextCart[lineKey];
      } else {
        nextCart[lineKey] = { ...existing, quantity: nextQty };
      }
      const nextInstant = { ...storage.instant };
      if (Object.keys(nextCart).length === 0) {
        delete nextInstant[vendorKey];
      } else {
        nextInstant[vendorKey] = nextCart;
      }
      persist({ ...storage, instant: nextInstant });
    },
    [persist, storage]
  );

  const clearInstantCart = useCallback(
    (businessId: string, branchId: string) => {
      const key = cartKey(businessId, branchId);
      if (!storage.instant[key]) return;
      const nextInstant = { ...storage.instant };
      delete nextInstant[key];
      persist({ ...storage, instant: nextInstant });
    },
    [persist, storage]
  );

  const getQuotationCart = useCallback(
    (businessId: string, branchId: string) => storage.quotation[cartKey(businessId, branchId)] ?? {},
    [storage]
  );

  const setQuotationCart = useCallback(
    (businessId: string, branchId: string, cart: Record<string, QuotationCartLine>) => {
      const key = cartKey(businessId, branchId);
      const nextQuotation = { ...storage.quotation };
      if (Object.keys(cart).length === 0) {
        delete nextQuotation[key];
      } else {
        nextQuotation[key] = cart;
      }
      persist({ ...storage, quotation: nextQuotation });
    },
    [persist, storage]
  );

  const clearQuotationCart = useCallback(
    (businessId: string, branchId: string) => {
      const key = cartKey(businessId, branchId);
      if (!storage.quotation[key]) return;
      const nextQuotation = { ...storage.quotation };
      delete nextQuotation[key];
      persist({ ...storage, quotation: nextQuotation });
    },
    [persist, storage]
  );

  const totalItemCount = useMemo(() => countItems(storage), [storage]);

  const value = useMemo(
    () => ({
      hydrated,
      totalItemCount,
      getInstantCart,
      upsertInstantLine,
      updateInstantLineQty,
      clearInstantCart,
      getQuotationCart,
      setQuotationCart,
      clearQuotationCart
    }),
    [
      hydrated,
      totalItemCount,
      getInstantCart,
      upsertInstantLine,
      updateInstantLineQty,
      clearInstantCart,
      getQuotationCart,
      setQuotationCart,
      clearQuotationCart
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartStore() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartStore must be used within CartProvider");
  return ctx;
}

export function useInstantCart(businessId: string, branchId: string) {
  const { hydrated, getInstantCart, upsertInstantLine, updateInstantLineQty, clearInstantCart } = useCartStore();
  const cart = getInstantCart(businessId, branchId);

  const addLine = useCallback(
    (line: InstantCartLine) => upsertInstantLine(businessId, branchId, line),
    [businessId, branchId, upsertInstantLine]
  );

  const updateLineQty = useCallback(
    (lineKey: string, delta: number) => updateInstantLineQty(businessId, branchId, lineKey, delta),
    [businessId, branchId, updateInstantLineQty]
  );

  const clearCart = useCallback(() => clearInstantCart(businessId, branchId), [businessId, branchId, clearInstantCart]);

  return { cart, addLine, updateLineQty, clearCart, hydrated };
}

export function useQuotationCart(businessId: string, branchId: string) {
  const { hydrated, getQuotationCart, setQuotationCart, clearQuotationCart } = useCartStore();
  const cart = getQuotationCart(businessId, branchId);

  const setCart = useCallback(
    (next: Record<string, QuotationCartLine>) => setQuotationCart(businessId, branchId, next),
    [businessId, branchId, setQuotationCart]
  );

  const addLine = useCallback(
    (line: QuotationCartLine) => {
      const lineKey = instantLineKey(line.menuItemId, line.optionLabels);
      const current = getQuotationCart(businessId, branchId);
      const existing = current[lineKey];
      setQuotationCart(businessId, branchId, {
        ...current,
        [lineKey]: {
          ...line,
          quantity: (existing?.quantity ?? 0) + line.quantity
        }
      });
    },
    [businessId, branchId, getQuotationCart, setQuotationCart]
  );

  const updateLineQty = useCallback(
    (lineKey: string, delta: number) => {
      const current = getQuotationCart(businessId, branchId);
      const existing = current[lineKey];
      if (!existing) return;
      const nextQty = existing.quantity + delta;
      const next = { ...current };
      if (nextQty <= 0) {
        delete next[lineKey];
      } else {
        next[lineKey] = { ...existing, quantity: nextQty };
      }
      setQuotationCart(businessId, branchId, next);
    },
    [businessId, branchId, getQuotationCart, setQuotationCart]
  );

  const clearCart = useCallback(() => clearQuotationCart(businessId, branchId), [businessId, branchId, clearQuotationCart]);

  return { cart, setCart, addLine, updateLineQty, clearCart, hydrated };
}

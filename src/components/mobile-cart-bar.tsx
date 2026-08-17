"use client";

import { useMemo, useState, useEffect } from "react";
import { ShoppingBag, X } from "lucide-react";
import { useInstantCart } from "@/lib/cart-store";
import { formatZAR } from "@/lib/utils";

export function MobileCartBar({
  businessId,
  branchId,
  children
}: {
  businessId: string;
  branchId: string;
  children: React.ReactNode;
}) {
  const { cart } = useInstantCart(businessId, branchId);
  const [open, setOpen] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const lines = useMemo(() => Object.entries(cart).filter(([, line]) => line.quantity > 0), [cart]);
  const itemCount = lines.reduce((sum, [, line]) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, [, line]) => sum + line.unitPrice * line.quantity, 0);

  if (itemCount === 0) return null;

  return (
    <>
      {/* Sticky mobile bar - hidden on lg and up */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-charcoal-200 bg-white shadow-lg lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium text-charcoal-900 hover:bg-charcoal-50 transition"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-semibold">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
          </span>
          <span className="text-base font-bold text-amber-600">{formatZAR(subtotal)}</span>
        </button>
      </div>

      {/* Mobile cart modal */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4 lg:hidden">
          <div className="absolute inset-0 bg-charcoal-900/50" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-cart-title"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal-100 bg-white px-4 py-4 sm:rounded-t-3xl">
              <h2 id="mobile-cart-title" className="font-display text-lg font-semibold text-charcoal-900">
                Your cart
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-charcoal-600 hover:bg-charcoal-100"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, Zap, Tag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createInstantOrderAction } from "@/server/actions/instant-order";
import { validatePromoCodeAction } from "@/server/actions/promotions";
import { formatZAR } from "@/lib/utils";
import { useAddressStore } from "@/lib/address-store";
import { TIP_PRESETS_PERCENT } from "@/lib/promotions";
import { AddressSelector, type ResolvedDelivery } from "@/components/address-selector";

type ItemLite = {
  id: string;
  name: string;
  basePrice: number;
  unitLabel: string | null;
  options: Array<{ choiceLabel: string; priceDelta: number }>;
};

export function InstantOrderCart({
  businessId,
  branchId,
  branchLat,
  branchLng,
  deliveryRadiusKm,
  fulfillmentType,
  items,
  isOpen
}: {
  businessId: string;
  branchId: string;
  branchLat: number;
  branchLng: number;
  deliveryRadiusKm: number | null;
  fulfillmentType: "PICKUP" | "DELIVERY" | "EITHER";
  items: ItemLite[];
  isOpen: boolean;
}) {
  const router = useRouter();
  const { mode } = useAddressStore();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(fulfillmentType === "DELIVERY" ? "DELIVERY" : "PICKUP");
  const [resolvedDelivery, setResolvedDelivery] = useState<ResolvedDelivery>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAsap, setIsAsap] = useState(true);
  const [scheduledFor, setScheduledFor] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number; label: string } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [tipPercent, setTipPercent] = useState<number | null>(10);
  const [customTip, setCustomTip] = useState("");

  // Sync with the header's saved delivery/pickup preference.
  useEffect(() => {
    if (fulfillmentType === "EITHER") setFulfillment(mode);
  }, [mode, fulfillmentType]);

  // A closed store can't take ASAP orders — default to scheduling ahead instead.
  useEffect(() => {
    if (!isOpen) setIsAsap(false);
  }, [isOpen]);

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ item: items.find((i) => i.id === id)!, qty })),
    [cart, items]
  );
  const subtotal = lines.reduce((sum, l) => sum + l.item.basePrice * l.qty, 0);
  const tipAmount = customTip ? Number(customTip) || 0 : tipPercent ? Math.round(subtotal * (tipPercent / 100) * 100) / 100 : 0;
  const discountAmount = appliedPromo?.discountAmount ?? 0;
  const deliveryFee = fulfillment === "DELIVERY" && resolvedDelivery?.inRange ? resolvedDelivery.fee : 0;
  const total = Math.max(0, subtotal - discountAmount) + deliveryFee + tipAmount;

  function updateQty(id: string, delta: number) {
    setCart((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
  }

  async function applyPromo() {
    if (!promoInput.trim()) return;
    setValidatingPromo(true);
    const res = await validatePromoCodeAction(promoInput.trim(), businessId, subtotal);
    setValidatingPromo(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setAppliedPromo({ code: promoInput.trim().toUpperCase(), discountAmount: res.discountAmount, label: res.label });
    toast.success(res.label);
  }

  async function checkout() {
    if (lines.length === 0) {
      toast.error("Add at least one item.");
      return;
    }
    if (fulfillment === "DELIVERY" && !resolvedDelivery) {
      toast.error("Please choose a delivery address.");
      return;
    }
    if (fulfillment === "DELIVERY" && resolvedDelivery && !resolvedDelivery.inRange) {
      toast.error("That address is outside this branch's delivery range. Switch to pickup or choose a closer address.");
      return;
    }
    if (!isAsap && !scheduledFor) {
      toast.error("Choose a date and time, or select ASAP.");
      return;
    }
    setSubmitting(true);
    const res = await createInstantOrderAction({
      businessId,
      branchId,
      fulfillmentType: fulfillment,
      deliveryAddress: fulfillment === "DELIVERY" ? resolvedDelivery?.label : undefined,
      deliveryLat: fulfillment === "DELIVERY" ? resolvedDelivery?.lat : undefined,
      deliveryLng: fulfillment === "DELIVERY" ? resolvedDelivery?.lng : undefined,
      items: lines.map((l) => ({ menuItemId: l.item.id, quantity: l.qty })),
      promoCode: appliedPromo?.code,
      tipAmount,
      isAsap,
      scheduledFor: !isAsap ? new Date(scheduledFor).toISOString() : undefined
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Order placed and paid (placeholder gateway)!");
    router.push("/dashboard/buyer");
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-olive-200 bg-olive-50 p-5">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-olive-900">
        <Zap className="h-4 w-4" /> Order now
      </h3>
      <p className="mt-1 text-xs text-olive-700">These items are available for instant order at this branch.</p>

      {!isOpen && (
        <div className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800">
          This vendor is currently closed. You can still schedule an order for when they reopen.
        </div>
      )}

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 border-b border-olive-100 pb-3 text-sm">
            <div>
              <p className="font-medium text-charcoal-800">{item.name}</p>
              <p className="text-xs text-charcoal-500">
                {formatZAR(item.basePrice)}
                {item.unitLabel ? ` / ${item.unitLabel}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateQty(item.id, -1)}
                aria-label={`Decrease ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-charcoal-200 bg-white text-charcoal-600 hover:bg-charcoal-50 focus-ring"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center font-medium">{cart[item.id] ?? 0}</span>
              <button
                type="button"
                onClick={() => updateQty(item.id, 1)}
                aria-label={`Increase ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-charcoal-200 bg-white text-charcoal-600 hover:bg-charcoal-50 focus-ring"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {fulfillmentType === "EITHER" && (
        <div className="mt-4 flex gap-2">
          {(["PICKUP", "DELIVERY"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFulfillment(f)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                fulfillment === f ? "border-olive-600 bg-white text-olive-800" : "border-olive-200 text-olive-700"
              }`}
            >
              {f === "PICKUP" ? "Pickup" : "Delivery"}
            </button>
          ))}
        </div>
      )}

      {fulfillment === "DELIVERY" && (
        <div className="mt-3">
          <AddressSelector
            branchLat={branchLat}
            branchLng={branchLng}
            deliveryRadiusKm={deliveryRadiusKm}
            onResolved={setResolvedDelivery}
          />
        </div>
      )}

      {/* ASAP vs schedule for later */}
      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-olive-800">
          <Clock className="h-3.5 w-3.5" /> When
        </p>
        <div className="mt-1.5 flex gap-2">
          <button
            type="button"
            disabled={!isOpen}
            onClick={() => setIsAsap(true)}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${
              isAsap ? "border-olive-600 bg-white text-olive-800" : "border-olive-200 text-olive-700"
            }`}
          >
            ASAP
          </button>
          <button
            type="button"
            onClick={() => setIsAsap(false)}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
              !isAsap ? "border-olive-600 bg-white text-olive-800" : "border-olive-200 text-olive-700"
            }`}
          >
            Schedule for later
          </button>
        </div>
        {!isAsap && (
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="mt-2 w-full rounded-lg border border-olive-200 px-3 py-2 text-sm focus-ring"
          />
        )}
      </div>

      {/* Promo code */}
      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-olive-800">
          <Tag className="h-3.5 w-3.5" /> Promo code
        </p>
        {appliedPromo ? (
          <div className="mt-1.5 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
            <span className="font-medium text-olive-800">{appliedPromo.code} — {appliedPromo.label}</span>
            <button onClick={() => setAppliedPromo(null)} className="text-charcoal-400 hover:text-red-600">
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-1.5 flex gap-2">
            <input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Enter code"
              className="flex-1 rounded-lg border border-olive-200 px-3 py-2 text-sm focus-ring"
            />
            <Button size="sm" variant="outline" onClick={applyPromo} disabled={validatingPromo}>
              {validatingPromo ? "Checking..." : "Apply"}
            </Button>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="mt-4">
        <p className="text-xs font-semibold text-olive-800">Tip {fulfillment === "DELIVERY" ? "your driver" : "the vendor"}</p>
        <div className="mt-1.5 flex gap-2">
          {TIP_PRESETS_PERCENT.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setTipPercent(p);
                setCustomTip("");
              }}
              className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold ${
                tipPercent === p && !customTip ? "border-olive-600 bg-white text-olive-800" : "border-olive-200 text-olive-700"
              }`}
            >
              {p === 0 ? "No tip" : `${p}%`}
            </button>
          ))}
        </div>
        <input
          value={customTip}
          onChange={(e) => {
            setCustomTip(e.target.value);
            setTipPercent(null);
          }}
          type="number"
          min={0}
          placeholder="Custom amount (R)"
          className="mt-2 w-full rounded-lg border border-olive-200 px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div className="mt-4 space-y-1 border-t border-olive-100 pt-3 text-sm">
        <div className="flex justify-between text-olive-700">
          <span>Subtotal</span>
          <span>{formatZAR(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-olive-700">
            <span>Discount</span>
            <span>-{formatZAR(discountAmount)}</span>
          </div>
        )}
        {deliveryFee > 0 && (
          <div className="flex justify-between text-olive-700">
            <span>Delivery fee</span>
            <span>{formatZAR(deliveryFee)}</span>
          </div>
        )}
        {tipAmount > 0 && (
          <div className="flex justify-between text-olive-700">
            <span>Tip</span>
            <span>{formatZAR(tipAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 text-base font-semibold text-olive-900">
          <span>Total</span>
          <span className="font-display text-lg">{formatZAR(total)}</span>
        </div>
      </div>

      <Button
        onClick={checkout}
        disabled={submitting || (fulfillment === "DELIVERY" && resolvedDelivery !== null && !resolvedDelivery.inRange)}
        className="mt-3 w-full"
        variant="secondary"
      >
        {submitting ? "Placing order..." : "Checkout & pay now"}
      </Button>
    </div>
  );
}

"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createPromotionAction } from "@/server/actions/promotions";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create promo code"}
    </Button>
  );
}

export function NewPromotionForm({ businessId }: { businessId: string }) {
  const [state, formAction] = useFormState(createPromotionAction, initialState);
  const [type, setType] = useState<"PERCENTAGE_OFF" | "AMOUNT_OFF" | "FREE_DELIVERY">("PERCENTAGE_OFF");

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="businessId" value={businessId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Code</label>
          <input name="code" required placeholder="WELCOME20" className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm uppercase focus-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Type</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          >
            <option value="PERCENTAGE_OFF">Percentage off</option>
            <option value="AMOUNT_OFF">Amount off (R)</option>
            <option value="FREE_DELIVERY">Free delivery</option>
          </select>
        </div>
      </div>

      {type !== "FREE_DELIVERY" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-charcoal-600">{type === "PERCENTAGE_OFF" ? "Percentage" : "Amount (R)"}</label>
            <input name="value" type="number" min={0} step="0.01" required className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
          </div>
          {type === "PERCENTAGE_OFF" && (
            <div>
              <label className="block text-xs font-medium text-charcoal-600">Max discount (R, optional)</label>
              <input name="maxDiscount" type="number" min={0} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
            </div>
          )}
        </div>
      )}
      {type === "FREE_DELIVERY" && <input type="hidden" name="value" value="0" />}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Min order (R)</label>
          <input name="minOrderAmount" type="number" min={0} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Usage limit</label>
          <input name="usageLimit" type="number" min={1} placeholder="Unlimited" className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Per-buyer limit</label>
          <input name="perUserLimit" type="number" min={1} defaultValue={1} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-charcoal-600">Expires (optional)</label>
        <input name="expiresAt" type="date" className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
      </div>

      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

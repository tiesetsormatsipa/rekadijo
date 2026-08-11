"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateBusinessSettingsAction } from "@/server/actions/branch";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import type { OrderingMode } from "@prisma/client";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save settings"}
    </Button>
  );
}

export function SettingsForm(props: {
  businessId: string;
  description: string;
  category: string;
  whatsapp: string;
  email: string;
  minOrderAmount?: number;
  leadTimeHours: number;
  quotationResponseHours: number;
  orderingMode: OrderingMode;
}) {
  const [state, formAction] = useFormState(updateBusinessSettingsAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="businessId" value={props.businessId} />

      <div>
        <label className="block text-xs font-medium text-charcoal-600">Category</label>
        <input name="category" defaultValue={props.category} required className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
      </div>

      <div>
        <label className="block text-xs font-medium text-charcoal-600">Description</label>
        <textarea name="description" defaultValue={props.description} rows={3} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">WhatsApp</label>
          <input name="whatsapp" defaultValue={props.whatsapp} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Business email</label>
          <input name="email" type="email" defaultValue={props.email} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Min order (R)</label>
          <input name="minOrderAmount" type="number" step="1" defaultValue={props.minOrderAmount} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Lead time (hrs)</label>
          <input name="leadTimeHours" type="number" min={1} defaultValue={props.leadTimeHours} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Quote response SLA (hrs)</label>
          <input name="quotationResponseHours" type="number" min={1} defaultValue={props.quotationResponseHours} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-charcoal-600">Ordering mode</label>
        <select name="orderingMode" defaultValue={props.orderingMode} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring">
          <option value="QUOTATION_ONLY">Quotation only</option>
          <option value="INSTANT_ONLY">Instant order only</option>
          <option value="BOTH">Both — quotation and instant order</option>
        </select>
        <p className="mt-1 text-xs text-charcoal-400">
          This is the business-wide default. Instant ordering can still be toggled per branch and per item.
        </p>
      </div>

      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

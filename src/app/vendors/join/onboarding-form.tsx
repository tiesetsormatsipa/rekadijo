"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerBusinessAction } from "@/server/actions/business";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Submitting..." : "Submit for verification"}
    </Button>
  );
}

const inputClass = "mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm focus-ring";
const labelClass = "block text-sm font-medium text-charcoal-700";

export function OnboardingForm() {
  const [state, formAction] = useActionState(registerBusinessAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className={labelClass} htmlFor="businessName">Business name</label>
        <input id="businessName" name="businessName" required className={inputClass} placeholder="e.g. TR. Matsipa Market" />
      </div>

      <div>
        <label className={labelClass} htmlFor="category">Category</label>
        <input id="category" name="category" required className={inputClass} placeholder="Kota & Sphatlo, Home-cooked, Catering..." />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="whatsapp">WhatsApp</label>
          <input id="whatsapp" name="whatsapp" className={inputClass} placeholder="+27..." />
        </div>
        <div>
          <label className={labelClass} htmlFor="email">Business email</label>
          <input id="email" name="email" type="email" className={inputClass} />
        </div>
      </div>

      <hr className="border-charcoal-100" />
      <p className="text-sm font-semibold text-charcoal-800">First branch</p>

      <div>
        <label className={labelClass} htmlFor="addressLine">Address</label>
        <input id="addressLine" name="addressLine" required className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="city">City / Town</label>
          <input id="city" name="city" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="postalCode">Postal code</label>
          <input id="postalCode" name="postalCode" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="latitude">Latitude</label>
          <input id="latitude" name="latitude" type="number" step="any" required className={inputClass} placeholder="-28.1136" />
        </div>
        <div>
          <label className={labelClass} htmlFor="longitude">Longitude</label>
          <input id="longitude" name="longitude" type="number" step="any" required className={inputClass} placeholder="24.8472" />
        </div>
      </div>
      <p className="-mt-2 text-xs text-charcoal-400">
        No mapping API is wired yet — enter coordinates manually for now (e.g. from Google Maps &quot;copy
        coordinates&quot;). This becomes an address autocomplete once a maps key is added.
      </p>

      <div>
        <label className={labelClass} htmlFor="fulfillmentType">Fulfillment</label>
        <select id="fulfillmentType" name="fulfillmentType" className={inputClass} defaultValue="EITHER">
          <option value="PICKUP">Pickup only</option>
          <option value="DELIVERY">Delivery only</option>
          <option value="EITHER">Pickup or delivery</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="deliveryRadiusKm">Delivery radius (km)</label>
          <input id="deliveryRadiusKm" name="deliveryRadiusKm" type="number" step="0.1" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="minOrderAmount">Minimum order (R)</label>
          <input id="minOrderAmount" name="minOrderAmount" type="number" step="1" className={inputClass} />
        </div>
      </div>

      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

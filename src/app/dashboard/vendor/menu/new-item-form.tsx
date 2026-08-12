"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ImagePlus } from "lucide-react";
import { createMenuItemAction } from "@/server/actions/menu";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add menu item"}
    </Button>
  );
}

export function NewItemForm({ businessId, categories }: { businessId: string; categories: Array<{ id: string; name: string }> }) {
  const [state, formAction] = useActionState(createMenuItemAction, initialState);
  const [fileName, setFileName] = useState("");

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-3">
      <p className="text-sm font-semibold text-charcoal-800">Add a menu item</p>
      <input type="hidden" name="businessId" value={businessId} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Category</label>
          <select name="categoryId" required className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Name</label>
          <input name="name" required className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-charcoal-600">Description</label>
        <textarea name="description" rows={2} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-charcoal-200 bg-charcoal-50 p-4 text-sm text-charcoal-600 transition hover:border-amber-400 hover:bg-amber-50/50">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
          <ImagePlus className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-charcoal-800">Upload product image</span>
          <span className="block truncate text-xs text-charcoal-500">
            {fileName || "JPG, PNG, WebP, GIF, or MP4. Vendors can replace it later."}
          </span>
        </span>
        <input
          name="file"
          type="file"
          accept="image/*,video/mp4"
          className="sr-only"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
        />
      </label>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Price (R)</label>
          <input name="basePrice" type="number" step="0.01" min={0} required className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Unit label</label>
          <input name="unitLabel" placeholder="loaf, bottle..." className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Min qty</label>
          <input name="minQuantity" type="number" min={1} defaultValue={1} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Max qty</label>
          <input name="maxQuantity" type="number" min={1} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-charcoal-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allowQuotation" defaultChecked className="h-4 w-4 rounded border-charcoal-300 text-amber-600" />
          Available for quotation
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allowInstantOrder" className="h-4 w-4 rounded border-charcoal-300 text-amber-600" />
          Available for instant order (default)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="showStockToBuyer" className="h-4 w-4 rounded border-charcoal-300 text-amber-600" />
          Show stock level to buyers
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-charcoal-600">Dietary tags (optional)</label>
        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-charcoal-600">
          {["VEGETARIAN", "VEGAN", "HALAL", "KOSHER", "CONTAINS_NUTS", "SPICY", "GLUTEN_FREE"].map((tag) => (
            <label key={tag} className="flex items-center gap-1.5">
              <input type="checkbox" name="dietaryTags" value={tag} className="h-3.5 w-3.5 rounded border-charcoal-300 text-amber-600" />
              {tag.replaceAll("_", " ").toLowerCase()}
            </label>
          ))}
        </div>
      </div>

      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

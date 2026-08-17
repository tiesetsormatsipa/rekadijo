"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2 } from "lucide-react";
import { updateMenuItemAction, deleteMediaAction } from "@/server/actions/menu";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

export function EditItemForm({
  menuItemId,
  businessId,
  categories,
  item
}: {
  menuItemId: string;
  businessId: string;
  categories: Array<{ id: string; name: string }>;
  item: {
    name: string;
    description?: string | null;
    categoryId: string;
    basePrice: number;
    unitLabel?: string | null;
    minQuantity: number;
    maxQuantity?: number | null;
    allowInstantOrder: boolean;
    allowQuotation: boolean;
    showStockToBuyer: boolean;
    dietaryTags: string[];
    mediaId?: string | null;
    mediaUrl?: string | null;
  };
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    updateMenuItemAction.bind(null, menuItemId),
    initialState
  );
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(item.mediaUrl || "");
  const [deletePending, startDeleteTransition] = useTransition();

  function handleDeleteMedia() {
    if (!item.mediaId) return;
    if (!confirm("Remove this image?")) return;

    startDeleteTransition(async () => {
      const res = await deleteMediaAction(item.mediaId!);
      if (!res.ok) {
        alert(res.error);
      } else {
        setPreview("");
        router.refresh();
      }
    });
  }

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-3">
      <p className="text-sm font-semibold text-charcoal-800">Edit menu item</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Category</label>
          <select
            name="categoryId"
            required
            defaultValue={item.categoryId}
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Name</label>
          <input
            name="name"
            defaultValue={item.name}
            required
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-charcoal-600">Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={item.description || ""}
          className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-charcoal-600">Product image</label>
        {preview ? (
          <div className="flex items-center gap-3 rounded-xl border border-charcoal-200 bg-charcoal-50 p-4">
            <img
              src={preview}
              alt={item.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-charcoal-800">{fileName || "Current image"}</p>
              <p className="text-xs text-charcoal-500">Click below to replace or use the delete button</p>
            </div>
            <button
              type="button"
              disabled={deletePending}
              onClick={handleDeleteMedia}
              className="flex-none rounded-lg p-2 text-charcoal-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Delete image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <label className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed ${preview ? "border-charcoal-200 bg-charcoal-50" : "border-charcoal-200 bg-charcoal-50"} p-4 text-sm text-charcoal-600 transition hover:border-amber-400 hover:bg-amber-50/50`}>
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-charcoal-800">{preview ? "Replace" : "Upload"} product image</span>
            <span className="block truncate text-xs text-charcoal-500">
              {fileName || "JPG, PNG, WebP, GIF, or MP4"}
            </span>
          </span>
          <input
            name="file"
            type="file"
            accept="image/*,video/mp4"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setFileName(file.name);
                setPreview(URL.createObjectURL(file));
              }
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Price (R)</label>
          <input
            name="basePrice"
            type="number"
            step="0.01"
            min={0}
            defaultValue={item.basePrice}
            required
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Unit label</label>
          <input
            name="unitLabel"
            placeholder="loaf, bottle..."
            defaultValue={item.unitLabel || ""}
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Min qty</label>
          <input
            name="minQuantity"
            type="number"
            min={1}
            defaultValue={item.minQuantity}
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Max qty</label>
          <input
            name="maxQuantity"
            type="number"
            min={1}
            defaultValue={item.maxQuantity || ""}
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-charcoal-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="allowQuotation"
            defaultChecked={item.allowQuotation}
            className="h-4 w-4 rounded border-charcoal-300 text-amber-600"
          />
          Available for quotation
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="allowInstantOrder"
            defaultChecked={item.allowInstantOrder}
            className="h-4 w-4 rounded border-charcoal-300 text-amber-600"
          />
          Available for instant order
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="showStockToBuyer"
            defaultChecked={item.showStockToBuyer}
            className="h-4 w-4 rounded border-charcoal-300 text-amber-600"
          />
          Show stock level to buyers
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-charcoal-600">Dietary tags (optional)</label>
        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-charcoal-600">
          {["VEGETARIAN", "VEGAN", "HALAL", "KOSHER", "CONTAINS_NUTS", "SPICY", "GLUTEN_FREE"].map((tag) => (
            <label key={tag} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                name="dietaryTags"
                value={tag}
                defaultChecked={item.dietaryTags.includes(tag)}
                className="h-3.5 w-3.5 rounded border-charcoal-300 text-amber-600"
              />
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

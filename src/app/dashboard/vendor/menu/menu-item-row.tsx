"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2, Upload, Edit2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toggleMenuItemActiveAction, deleteMenuItemAction, uploadMenuItemMediaAction } from "@/server/actions/menu";
import { EditItemForm } from "./edit-item-form";

type ItemRow = {
  id: string;
  name: string;
  priceLabel: string;
  allowInstantOrder: boolean;
  allowQuotation: boolean;
  showStockToBuyer: boolean;
  isActive: boolean;
  mediaUrl: string | null;
  description?: string | null;
  categoryId: string;
  basePrice: number;
  unitLabel?: string | null;
  minQuantity: number;
  maxQuantity?: number | null;
  dietaryTags: string[];
  mediaId?: string | null;
};

export function MenuItemRow({
  item,
  businessId,
  categories
}: {
  item: ItemRow;
  businessId: string;
  categories: Array<{ id: string; name: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(item.mediaUrl);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const res = await uploadMenuItemMediaAction(item.id, formData);
      if (!res.ok) toast.error(res.error);
      else {
        setPreview(URL.createObjectURL(file));
        toast.success("Image uploaded.");
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInput.current?.click()}
            className="relative flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-lg border border-dashed border-charcoal-200 bg-charcoal-50 text-charcoal-300 hover:border-amber-400"
            title="Upload image"
          >
            {preview ? (
              <Image src={preview} alt={item.name} fill className="object-cover" unoptimized />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </button>
          <input ref={fileInput} type="file" accept="image/*,video/mp4" className="hidden" onChange={handleFile} />
          <div>
            <p className={`font-medium ${item.isActive ? "text-charcoal-900" : "text-charcoal-400 line-through"}`}>
              {item.name}
            </p>
            <p className="text-xs text-charcoal-500">{item.priceLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {item.allowInstantOrder && <Badge tone="success">Instant order</Badge>}
          {item.allowQuotation && <Badge tone="info">Quotation</Badge>}
          {item.showStockToBuyer && <Badge tone="neutral">Stock visible</Badge>}
          {!item.isActive && <Badge tone="danger">Inactive</Badge>}

          <button
            disabled={pending}
            onClick={() => setEditOpen(true)}
            className="rounded-lg p-1.5 text-charcoal-400 hover:bg-blue-50 hover:text-blue-600"
            aria-label="Edit item"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await toggleMenuItemActiveAction(item.id);
                if (!res.ok) toast.error(res.error);
                else router.refresh();
              })
            }
            className="rounded-full border border-charcoal-200 px-3 py-1 text-xs font-medium text-charcoal-600 hover:bg-charcoal-50"
          >
            {item.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (!confirm(`Remove ${item.name} from the menu?`)) return;
                const res = await deleteMenuItemAction(item.id);
                if (!res.ok) toast.error(res.error);
                else router.refresh();
              })
            }
            className="rounded-lg p-1.5 text-charcoal-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center">
          <div className="w-full bg-white p-6 shadow-lg sm:mx-auto sm:max-w-2xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-charcoal-900">Edit menu item</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-lg p-1 text-charcoal-400 hover:bg-charcoal-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <EditItemForm
              menuItemId={item.id}
              categories={categories}
              item={{
                name: item.name,
                description: item.description,
                categoryId: item.categoryId,
                basePrice: item.basePrice,
                unitLabel: item.unitLabel,
                minQuantity: item.minQuantity,
                maxQuantity: item.maxQuantity,
                allowInstantOrder: item.allowInstantOrder,
                allowQuotation: item.allowQuotation,
                showStockToBuyer: item.showStockToBuyer,
                dietaryTags: item.dietaryTags,
                mediaId: item.mediaId,
                mediaUrl: item.mediaUrl
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}


"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteItemButton } from "@/components/favorite-item-button";
import { MenuItemModal, type MenuItemModalItem } from "@/components/menu-item-modal";
import { useInstantCart, useQuotationCart } from "@/lib/cart-store";

export type VendorMenuCategory = {
  id: string;
  name: string;
  items: Array<
    MenuItemModalItem & {
      isAvailable: boolean;
      isInstant: boolean;
      allowQuotation: boolean;
      showLowStock?: boolean;
    }
  >;
};

export function VendorMenuItems({
  businessId,
  branchId,
  categories,
  favoriteIds,
  isLoggedIn,
  hasInstant
}: {
  businessId: string;
  branchId: string;
  categories: VendorMenuCategory[];
  favoriteIds: string[];
  isLoggedIn: boolean;
  hasInstant: boolean;
}) {
  const { addLine: addInstantLine } = useInstantCart(businessId, branchId);
  const { addLine: addQuotationLine } = useQuotationCart(businessId, branchId);
  const [modalItem, setModalItem] = useState<(MenuItemModalItem & { isInstant: boolean; allowQuotation: boolean }) | null>(null);
  const [modalMode, setModalMode] = useState<"instant" | "quotation">("instant");

  function openModal(
    item: VendorMenuCategory["items"][number],
    mode: "instant" | "quotation"
  ) {
    setModalItem(item);
    setModalMode(mode);
  }

  return (
    <>
      {categories.map((category) => (
        <div key={category.id} id={`category-${category.id}`} className="mb-10 scroll-mt-32">
          <h3 className="font-display text-xl font-semibold text-charcoal-900">{category.name}</h3>
          <div className="mt-4 divide-y divide-charcoal-100 overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-card">
            {category.items.map((item) => (
              <div
                key={item.id}
                className={`grid gap-4 p-4 sm:grid-cols-[112px_1fr] ${item.isAvailable ? "bg-white" : "bg-charcoal-50 opacity-60"}`}
              >
                <button
                  type="button"
                  onClick={() => item.isAvailable && openModal(item, item.isInstant && hasInstant ? "instant" : "quotation")}
                  className="relative h-28 overflow-hidden rounded-xl bg-charcoal-100 text-left"
                  disabled={!item.isAvailable}
                >
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt="" fill sizes="112px" className="object-cover" unoptimized />
                  )}
                </button>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => item.isAvailable && openModal(item, item.isInstant && hasInstant ? "instant" : "quotation")}
                      className="min-w-0 text-left"
                      disabled={!item.isAvailable}
                    >
                      <p className="font-semibold text-charcoal-900">{item.name}</p>
                      {item.description && <p className="mt-1 text-sm text-charcoal-500">{item.description}</p>}
                    </button>
                    <div className="flex flex-none items-start gap-2">
                      <p className="whitespace-nowrap font-semibold text-charcoal-900">
                        R{item.basePrice.toFixed(0)}
                        {item.unitLabel && <span className="text-xs font-normal text-charcoal-400"> /{item.unitLabel}</span>}
                      </p>
                      {isLoggedIn && <FavoriteItemButton menuItemId={item.id} initiallyFavorited={favoriteIds.includes(item.id)} />}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {!item.isAvailable && <Badge tone="danger">Unavailable at this branch</Badge>}
                    {item.isAvailable && item.isInstant && hasInstant && <Badge tone="success">Instant order</Badge>}
                    {item.isAvailable && item.allowQuotation && <Badge tone="info">Quotation</Badge>}
                    {item.showLowStock && <Badge tone="warning">Low stock</Badge>}
                    {item.dietaryTags.map((tag) => (
                      <Badge key={tag} tone="neutral">
                        {tag.replaceAll("_", " ").toLowerCase()}
                      </Badge>
                    ))}
                    {item.options.length > 0 && <Badge tone="neutral">Customizable</Badge>}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-charcoal-400">
                      {item.options.length > 0 ? "Tap to choose options." : "Tap for details and add to order."}
                    </span>
                    {item.isAvailable && (
                      <div className="flex gap-2">
                        {item.isInstant && hasInstant && (
                          <button
                            type="button"
                            onClick={() => openModal(item, "instant")}
                            className="inline-flex items-center gap-1 rounded-full bg-charcoal-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-charcoal-700"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Add
                          </button>
                        )}
                        {item.allowQuotation && (
                          <button
                            type="button"
                            onClick={() => openModal(item, "quotation")}
                            className="inline-flex items-center gap-1 rounded-full border border-charcoal-300 px-3 py-1.5 text-xs font-semibold text-charcoal-700 transition hover:bg-charcoal-50"
                          >
                            Quote
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <MenuItemModal
        item={modalItem}
        open={Boolean(modalItem)}
        mode={modalMode}
        onClose={() => setModalItem(null)}
        onAdd={({ quantity, unitPrice, optionLabels }) => {
          if (!modalItem) return;
          if (modalMode === "instant") {
            addInstantLine({
              menuItemId: modalItem.id,
              name: modalItem.name,
              unitPrice,
              quantity,
              optionLabels
            });
          } else {
            addQuotationLine({
              menuItemId: modalItem.id,
              name: modalItem.name,
              unitPrice,
              quantity,
              optionLabels
            });
          }
        }}
      />
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatZAR } from "@/lib/utils";
import { groupMenuOptions, resolveSelectedOptions } from "@/lib/menu-options";

export type MenuItemModalItem = {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  unitLabel?: string | null;
  imageUrl?: string | null;
  dietaryTags: string[];
  minQuantity?: number;
  options: Array<{ name: string; choiceLabel: string; priceDelta: number; isDefault?: boolean }>;
};

export function MenuItemModal({
  item,
  open,
  mode,
  onClose,
  onAdd
}: {
  item: MenuItemModalItem | null;
  open: boolean;
  mode: "instant" | "quotation";
  onClose: () => void;
  onAdd: (payload: { quantity: number; unitPrice: number; optionLabels: string[] }) => void;
}) {
  const optionGroups = useMemo(() => (item ? groupMenuOptions(item.options) : []), [item]);
  const [quantity, setQuantity] = useState(1);
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!item || !open) return;
    setQuantity(item.minQuantity && item.minQuantity > 0 ? item.minQuantity : 1);
    const defaults: Record<string, string> = {};
    for (const group of groupMenuOptions(item.options)) {
      const defaultChoice = group.choices.find((c) => c.isDefault) ?? group.choices[0];
      if (defaultChoice) defaults[group.name] = defaultChoice.choiceLabel;
    }
    setSelectedByGroup(defaults);
  }, [item, open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !item) return null;

  const selectedLabels = optionGroups.map((g) => selectedByGroup[g.name]).filter(Boolean);
  const resolved = resolveSelectedOptions(item.options, selectedLabels);
  const unitPrice = item.basePrice + resolved.unitPriceDelta;
  const hasRequiredOptions = optionGroups.length > 0 && selectedLabels.length < optionGroups.length;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-charcoal-900/50" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-item-modal-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="relative h-48 bg-charcoal-100 sm:h-56">
          {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 512px" className="object-cover" unoptimized />}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-charcoal-700 shadow hover:bg-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <h2 id="menu-item-modal-title" className="font-display text-2xl font-semibold text-charcoal-900">
            {item.name}
          </h2>
          {item.description && <p className="mt-2 text-sm text-charcoal-600">{item.description}</p>}
          <p className="mt-3 font-semibold text-charcoal-900">
            {formatZAR(unitPrice)}
            {item.unitLabel ? <span className="text-sm font-normal text-charcoal-400"> / {item.unitLabel}</span> : null}
          </p>

          {item.dietaryTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.dietaryTags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag.replaceAll("_", " ").toLowerCase()}
                </Badge>
              ))}
            </div>
          )}

          {optionGroups.map((group) => (
            <div key={group.name} className="mt-5">
              <p className="text-sm font-semibold text-charcoal-800">{group.name}</p>
              <div className="mt-2 space-y-2">
                {group.choices.map((choice) => {
                  const selected = selectedByGroup[group.name] === choice.choiceLabel;
                  return (
                    <button
                      key={choice.choiceLabel}
                      type="button"
                      onClick={() => setSelectedByGroup((prev) => ({ ...prev, [group.name]: choice.choiceLabel }))}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
                        selected ? "border-charcoal-900 bg-charcoal-900 text-white" : "border-charcoal-200 text-charcoal-700 hover:bg-charcoal-50"
                      }`}
                    >
                      <span>{choice.choiceLabel}</span>
                      <span className={selected ? "text-white/90" : "text-charcoal-500"}>
                        {choice.priceDelta > 0 ? `+${formatZAR(choice.priceDelta)}` : "Included"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-charcoal-700">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(item.minQuantity ?? 1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-charcoal-200"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-charcoal-200"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button
            className="mt-5 w-full"
            disabled={hasRequiredOptions}
            onClick={() => {
              onAdd({ quantity, unitPrice, optionLabels: resolved.optionLabels });
              onClose();
            }}
          >
            {mode === "instant" ? "Add to cart" : "Add to quotation"} · {formatZAR(unitPrice * quantity)}
          </Button>
        </div>
      </div>
    </div>
  );
}

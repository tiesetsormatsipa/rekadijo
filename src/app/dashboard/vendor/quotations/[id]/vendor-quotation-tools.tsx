"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatZAR } from "@/lib/utils";
import { reviseQuotationAction, respondToQuotationAction } from "@/server/actions/quotations";
import type { QuotationStatus } from "@prisma/client";

type Line = { menuItemId: string; nameSnapshot: string; quantity: number; unitPrice: number };

export function VendorQuotationTools({
  quotationId,
  status,
  items,
  currentTotal
}: {
  quotationId: string;
  status: QuotationStatus;
  items: Line[];
  currentTotal: number;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(items);
  const initialSubtotal = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const [deliveryFee, setDeliveryFee] = useState<number>(Math.max(0, currentTotal - initialSubtotal));
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const editable = ["PENDING", "VIEWED", "REVISED"].includes(status);
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const total = subtotal + deliveryFee;

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function sendRevision() {
    startTransition(async () => {
      const res = await reviseQuotationAction({
        quotationId,
        items: lines,
        deliveryFee: deliveryFee || undefined,
        message: message || undefined
      });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Revised quotation sent to buyer.");
        router.refresh();
      }
    });
  }

  function decline() {
    startTransition(async () => {
      const res = await respondToQuotationAction(quotationId, "DECLINE", message || undefined);
      if (!res.ok) toast.error(res.error);
      else {
        toast.message("Quotation declined.");
        router.refresh();
      }
    });
  }

  if (!editable) {
    return (
      <div className="mt-8 rounded-xl bg-charcoal-50 p-4 text-sm text-charcoal-600">
        This quotation is <strong>{status.replaceAll("_", " ").toLowerCase()}</strong> and can no longer be revised
        from here.
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
      <h2 className="font-semibold text-charcoal-800">Review &amp; respond</h2>
      <p className="mt-1 text-xs text-charcoal-500">
        Adjust quantities or pricing if needed, then send a revised quotation, or accept as-is by sending with no
        changes.
      </p>

      <div className="mt-4 space-y-3">
        {lines.map((line, idx) => (
          <div key={line.menuItemId} className="grid grid-cols-12 items-center gap-2 text-sm">
            <span className="col-span-5 truncate text-charcoal-700">{line.nameSnapshot}</span>
            <input
              type="number"
              min={0}
              value={line.quantity}
              onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
              className="col-span-2 rounded-lg border border-charcoal-200 px-2 py-1.5 text-center focus-ring"
            />
            <span className="col-span-1 text-center text-charcoal-400">×</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={line.unitPrice}
              onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })}
              className="col-span-2 rounded-lg border border-charcoal-200 px-2 py-1.5 text-center focus-ring"
            />
            <span className="col-span-2 text-right font-medium text-charcoal-900">
              {formatZAR(line.unitPrice * line.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <label className="text-charcoal-600">Delivery fee</label>
        <input
          type="number"
          min={0}
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(Number(e.target.value))}
          className="w-28 rounded-lg border border-charcoal-200 px-2 py-1.5 focus-ring"
        />
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-charcoal-600">Message to buyer (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-charcoal-100 pt-4">
        <span className="text-sm text-charcoal-500">New total</span>
        <span className="font-display text-lg font-semibold text-charcoal-900">{formatZAR(total)}</span>
      </div>

      <div className="mt-4 flex gap-3">
        <Button onClick={sendRevision} disabled={pending}>
          {pending ? "Sending..." : "Send quotation to buyer"}
        </Button>
        <Button onClick={decline} disabled={pending} variant="outline">
          Decline request
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { respondToQuotationAction, payQuotationAction } from "@/server/actions/quotations";
import { TIP_PRESETS_PERCENT } from "@/lib/promotions";
import { formatZAR } from "@/lib/utils";
import type { QuotationStatus, FulfillmentType } from "@prisma/client";

export function QuotationActions({
  quotationId,
  status,
  total,
  fulfillmentType
}: {
  quotationId: string;
  status: QuotationStatus;
  total: number;
  fulfillmentType: FulfillmentType;
}) {
  const [pending, startTransition] = useTransition();
  const [tipPercent, setTipPercent] = useState<number | null>(10);
  const [customTip, setCustomTip] = useState("");
  const router = useRouter();

  const tipAmount = customTip ? Number(customTip) || 0 : tipPercent ? Math.round(total * (tipPercent / 100) * 100) / 100 : 0;

  function accept() {
    startTransition(async () => {
      const res = await respondToQuotationAction(quotationId, "ACCEPT");
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Quotation accepted. You can now pay to confirm your order.");
        router.refresh();
      }
    });
  }

  function decline() {
    startTransition(async () => {
      const res = await respondToQuotationAction(quotationId, "DECLINE");
      if (!res.ok) toast.error(res.error);
      else {
        toast.message("Quotation declined.");
        router.refresh();
      }
    });
  }

  function pay() {
    startTransition(async () => {
      const res = await payQuotationAction(quotationId, tipAmount);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Payment successful (placeholder gateway) — your order is scheduled.");
        router.refresh();
      }
    });
  }

  if (status === "PENDING" || status === "VIEWED") {
    return (
      <div className="mt-6 rounded-xl bg-charcoal-50 p-4 text-sm text-charcoal-600">
        Waiting for the vendor to respond to your request.
      </div>
    );
  }

  if (status === "REVISED") {
    return (
      <div className="mt-6 flex gap-3">
        <Button onClick={accept} disabled={pending}>
          Accept revised quotation
        </Button>
        <Button onClick={decline} disabled={pending} variant="outline">
          Decline
        </Button>
      </div>
    );
  }

  if (status === "PAYMENT_PENDING") {
    return (
      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
        <p className="text-sm font-semibold text-charcoal-800">
          Tip {fulfillmentType === "DELIVERY" ? "your driver" : "the vendor"} (optional)
        </p>
        <div className="mt-2 flex gap-2">
          {TIP_PRESETS_PERCENT.map((p) => (
            <button
              key={p}
              onClick={() => {
                setTipPercent(p);
                setCustomTip("");
              }}
              className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold ${
                tipPercent === p && !customTip ? "border-amber-600 bg-amber-50 text-amber-800" : "border-charcoal-200 text-charcoal-600"
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
          className="mt-2 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
        />

        <div className="mt-4 flex items-center justify-between border-t border-charcoal-100 pt-3 text-sm">
          <span className="text-charcoal-500">Total to pay</span>
          <span className="font-display text-lg font-semibold text-charcoal-900">{formatZAR(total + tipAmount)}</span>
        </div>

        <Button onClick={pay} disabled={pending} className="mt-3 w-full">
          {pending ? "Processing..." : "Pay now (placeholder gateway)"}
        </Button>
      </div>
    );
  }

  if (["PAID", "SCHEDULED", "IN_PREPARATION", "READY", "COMPLETED"].includes(status)) {
    return (
      <div className="mt-6 rounded-xl bg-olive-50 p-4 text-sm text-olive-800">
        This quotation has been paid — track progress under{" "}
        <a href="/dashboard/buyer" className="font-semibold underline">
          My orders
        </a>
        .
      </div>
    );
  }

  return null;
}

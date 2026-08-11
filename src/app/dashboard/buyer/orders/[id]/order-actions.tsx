"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelOrderAction, getReorderItemsAction } from "@/server/actions/orders";

export function OrderActions({ orderId, canCancel, canReorder }: { orderId: string; canCancel: boolean; canReorder: boolean }) {
  const [pending, startTransition] = useTransition();
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  function cancel() {
    startTransition(async () => {
      const res = await cancelOrderAction(orderId, reason || undefined);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Order cancelled.");
        setShowCancelForm(false);
        router.refresh();
      }
    });
  }

  function reorder() {
    startTransition(async () => {
      const res = await getReorderItemsAction(orderId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Take a look — add these back to your cart on the vendor page.");
      router.push(`/vendors/${res.businessSlug}?branch=${res.branchId}`);
    });
  }

  if (!canCancel && !canReorder) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {canReorder && (
        <Button size="sm" variant="outline" onClick={reorder} disabled={pending}>
          Order again
        </Button>
      )}
      {canCancel && !showCancelForm && (
        <Button size="sm" variant="danger" onClick={() => setShowCancelForm(true)} disabled={pending}>
          Cancel order
        </Button>
      )}
      {canCancel && showCancelForm && (
        <div className="w-full rounded-xl border border-red-100 bg-red-50 p-3">
          <label className="block text-xs font-medium text-red-800">Why are you cancelling? (optional)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus-ring"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="danger" onClick={cancel} disabled={pending}>
              {pending ? "Cancelling..." : "Confirm cancellation"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCancelForm(false)} disabled={pending}>
              Never mind
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

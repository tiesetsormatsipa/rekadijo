"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/server/actions/quotations";
import type { OrderStatus } from "@prisma/client";

const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  SCHEDULED: ["IN_PREPARATION", "CANCELED"],
  IN_PREPARATION: ["READY", "CANCELED"],
  READY: ["OUT_FOR_DELIVERY", "COMPLETED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["COMPLETED"]
};

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const options = NEXT_STATUSES[status];

  if (!options || options.length === 0) {
    return <span className="rounded-full bg-charcoal-100 px-3 py-1 text-xs font-medium text-charcoal-600">{status}</span>;
  }

  function handleChange(next: OrderStatus) {
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, next);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(`Order marked ${next.replaceAll("_", " ").toLowerCase()}.`);
        router.refresh();
      }
    });
  }

  return (
    <select
      disabled={pending}
      defaultValue=""
      onChange={(e) => e.target.value && handleChange(e.target.value as OrderStatus)}
      className="rounded-full border border-charcoal-200 px-3 py-1.5 text-xs font-medium focus-ring"
    >
      <option value="">{status.replaceAll("_", " ")} — update</option>
      {options.map((s) => (
        <option key={s} value={s}>
          Mark {s.replaceAll("_", " ").toLowerCase()}
        </option>
      ))}
    </select>
  );
}

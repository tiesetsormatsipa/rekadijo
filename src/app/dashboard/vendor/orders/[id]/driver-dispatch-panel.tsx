"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { assignDriverToOrderAction } from "@/server/actions/driver";

type Driver = { id: string; name: string; vehicleType: string | null; rating: number };

export function DriverDispatchPanel({ orderId, drivers }: { orderId: string; drivers: Driver[] }) {
  const [selected, setSelected] = useState(drivers[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (drivers.length === 0) {
    return <p className="text-sm text-charcoal-500">No drivers currently available.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
      >
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} {d.vehicleType ? `(${d.vehicleType})` : ""} · {d.rating.toFixed(1)}★
          </option>
        ))}
      </select>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await assignDriverToOrderAction({ orderId, driverId: selected });
            if (!res.ok) toast.error(res.error);
            else {
              toast.success("Driver assigned.");
              router.refresh();
            }
          })
        }
      >
        Assign driver
      </Button>
    </div>
  );
}

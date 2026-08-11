"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateDriverAssignmentStatusAction } from "@/server/actions/driver";
import type { DriverAssignmentStatus } from "@prisma/client";

const NEXT_STATUSES: Partial<Record<DriverAssignmentStatus, DriverAssignmentStatus[]>> = {
  ASSIGNED: ["ACCEPTED", "DECLINED"],
  ACCEPTED: ["EN_ROUTE_PICKUP"],
  EN_ROUTE_PICKUP: ["PICKED_UP"],
  PICKED_UP: ["EN_ROUTE_DROPOFF"],
  EN_ROUTE_DROPOFF: ["DELIVERED"]
};

export function AssignmentStatusControl({ assignmentId, status }: { assignmentId: string; status: DriverAssignmentStatus }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const options = NEXT_STATUSES[status];

  if (!options || options.length === 0) {
    return <span className="rounded-full bg-charcoal-100 px-3 py-1 text-xs font-medium text-charcoal-600">{status.replaceAll("_", " ")}</span>;
  }

  return (
    <select
      disabled={pending}
      defaultValue=""
      onChange={(e) => {
        const value = e.target.value as DriverAssignmentStatus;
        if (!value) return;
        startTransition(async () => {
          const res = await updateDriverAssignmentStatusAction({ assignmentId, status: value });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success(`Marked ${value.replaceAll("_", " ").toLowerCase()}.`);
            router.refresh();
          }
        });
      }}
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

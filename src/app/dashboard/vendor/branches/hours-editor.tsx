"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOperatingHourAction } from "@/server/actions/branch";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Hour = { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean };

export function HoursEditor({ branchId, hours }: { branchId: string; hours: Hour[] }) {
  const [rows, setRows] = useState<Hour[]>(
    Array.from({ length: 7 }, (_, i) => hours.find((h) => h.dayOfWeek === i) ?? { dayOfWeek: i, openTime: "08:00", closeTime: "17:00", isClosed: false })
  );
  const [pending, startTransition] = useTransition();

  function save(row: Hour) {
    startTransition(async () => {
      const res = await updateOperatingHourAction({ branchId, ...row });
      if (!res.ok) toast.error(res.error);
    });
  }

  function patch(day: number, patch: Partial<Hour>) {
    setRows((prev) => {
      const next = prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r));
      save(next.find((r) => r.dayOfWeek === day)!);
      return next;
    });
  }

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs font-semibold text-charcoal-500">Operating hours</summary>
      <div className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div key={row.dayOfWeek} className="flex items-center gap-3 text-xs">
            <span className="w-20 text-charcoal-600">{DAYS[row.dayOfWeek]}</span>
            <input
              disabled={pending || row.isClosed}
              type="time"
              value={row.openTime}
              onChange={(e) => patch(row.dayOfWeek, { openTime: e.target.value })}
              className="rounded border border-charcoal-200 px-2 py-1"
            />
            <span>–</span>
            <input
              disabled={pending || row.isClosed}
              type="time"
              value={row.closeTime}
              onChange={(e) => patch(row.dayOfWeek, { closeTime: e.target.value })}
              className="rounded border border-charcoal-200 px-2 py-1"
            />
            <label className="flex items-center gap-1.5 text-charcoal-500">
              <input
                disabled={pending}
                type="checkbox"
                checked={row.isClosed}
                onChange={(e) => patch(row.dayOfWeek, { isClosed: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-charcoal-300 text-amber-600"
              />
              Closed
            </label>
          </div>
        ))}
      </div>
    </details>
  );
}

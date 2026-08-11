"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateBranchItemAvailabilityAction } from "@/server/actions/quotations";

type Row = {
  menuItemId: string;
  name: string;
  isAvailable: boolean;
  isInstantOrderable: boolean;
  stockQuantity: number | null;
};

export function BranchAvailabilityPanel({ branchId, menuItems }: { branchId: string; menuItems: Row[] }) {
  const [rows, setRows] = useState(menuItems);
  const [pending, startTransition] = useTransition();

  function save(row: Row) {
    startTransition(async () => {
      const res = await updateBranchItemAvailabilityAction({
        branchId,
        menuItemId: row.menuItemId,
        isAvailable: row.isAvailable,
        isInstantOrderable: row.isInstantOrderable,
        stockQuantity: row.stockQuantity
      });
      if (!res.ok) toast.error(res.error);
      else toast.success(`${row.name} updated for this branch.`);
    });
  }

  function patch(menuItemId: string, patch: Partial<Row>) {
    setRows((prev) => {
      const next = prev.map((r) => (r.menuItemId === menuItemId ? { ...r, ...patch } : r));
      const updated = next.find((r) => r.menuItemId === menuItemId)!;
      save(updated);
      return next;
    });
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-charcoal-400">
            <th className="py-2 pr-4">Item</th>
            <th className="py-2 pr-4">Available</th>
            <th className="py-2 pr-4">Instant order</th>
            <th className="py-2 pr-4">Stock (vendor-only unless enabled)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-charcoal-50">
          {rows.map((row) => (
            <tr key={row.menuItemId}>
              <td className="py-2 pr-4 font-medium text-charcoal-800">{row.name}</td>
              <td className="py-2 pr-4">
                <input
                  type="checkbox"
                  checked={row.isAvailable}
                  disabled={pending}
                  onChange={(e) => patch(row.menuItemId, { isAvailable: e.target.checked })}
                  className="h-4 w-4 rounded border-charcoal-300 text-amber-600 focus-ring"
                />
              </td>
              <td className="py-2 pr-4">
                <input
                  type="checkbox"
                  checked={row.isInstantOrderable}
                  disabled={pending}
                  onChange={(e) => patch(row.menuItemId, { isInstantOrderable: e.target.checked })}
                  className="h-4 w-4 rounded border-charcoal-300 text-amber-600 focus-ring"
                />
              </td>
              <td className="py-2 pr-4">
                <input
                  type="number"
                  min={0}
                  value={row.stockQuantity ?? ""}
                  disabled={pending}
                  onChange={(e) =>
                    patch(row.menuItemId, { stockQuantity: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className="w-24 rounded-lg border border-charcoal-200 px-2 py-1 focus-ring"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

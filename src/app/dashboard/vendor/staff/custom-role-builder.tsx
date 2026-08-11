"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createCustomRoleAction } from "@/server/actions/staff";
import { Button } from "@/components/ui/button";

type Perm = { key: string; label: string; category: string };

export function CustomRoleBuilder({ businessId, permissions }: { businessId: string; permissions: Perm[] }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const grouped = permissions.reduce<Record<string, Perm[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  function toggle(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function create() {
    if (!name.trim() || selected.length === 0) {
      toast.error("Name the role and pick at least one permission.");
      return;
    }
    startTransition(async () => {
      const res = await createCustomRoleAction({ businessId, name, permissions: selected });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Custom role created.");
        setName("");
        setSelected([]);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Role name, e.g. Weekend Manager"
        className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
      />
      <div className="space-y-3">
        {Object.entries(grouped).map(([category, perms]) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">{category}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {perms.map((p) => (
                <label
                  key={p.key}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium ${
                    selected.includes(p.key) ? "border-amber-600 bg-amber-50 text-amber-800" : "border-charcoal-200 text-charcoal-600"
                  }`}
                >
                  <input type="checkbox" checked={selected.includes(p.key)} onChange={() => toggle(p.key)} className="hidden" />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button size="sm" onClick={create} disabled={pending}>
        {pending ? "Creating..." : "Create custom role"}
      </Button>
    </div>
  );
}

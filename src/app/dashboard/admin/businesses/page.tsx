import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { AdminBusinessActions } from "../admin-business-actions";
import { SuspendBusinessButton } from "./suspend-business-button";

const TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  APPROVED: "success",
  PENDING_VERIFICATION: "warning",
  REJECTED: "danger",
  SUSPENDED: "danger",
  ARCHIVED: "neutral"
};

export default async function AdminBusinessesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const businesses = await prisma.business.findMany({
    include: { owner: true, branches: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">All businesses</h1>

      <div className="mt-6 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
        {businesses.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-charcoal-900">{b.name}</p>
              <p className="text-xs text-charcoal-500">
                {b.category} · {b.owner.firstName} {b.owner.lastName} · {b.branches.length} branch{b.branches.length !== 1 ? "es" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={TONE[b.status] ?? "neutral"}>{b.status.replaceAll("_", " ")}</Badge>
              {b.status === "PENDING_VERIFICATION" && <AdminBusinessActions businessId={b.id} />}
              {(b.status === "APPROVED" || b.status === "SUSPENDED") && (
                <SuspendBusinessButton businessId={b.id} isSuspended={b.status === "SUSPENDED"} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

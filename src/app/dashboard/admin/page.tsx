import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { AdminBusinessActions } from "./admin-business-actions";
import { Users, Store, ClipboardList, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [pendingBusinesses, counts] = await Promise.all([
    prisma.business.findMany({
      where: { status: "PENDING_VERIFICATION" },
      include: { owner: true, branches: true },
      orderBy: { createdAt: "asc" }
    }),
    Promise.all([
      prisma.user.count(),
      prisma.business.count({ where: { status: "APPROVED" } }),
      prisma.quotation.count(),
      prisma.order.count()
    ])
  ]);

  const [userCount, approvedBusinesses, quotationCount, orderCount] = counts;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Platform overview</h1>
      <p className="mt-1 text-charcoal-500">Signed in as {user.firstName} ({user.globalRole})</p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm md:hidden">
        <Link href="/dashboard/admin/businesses" className="rounded-full border border-charcoal-200 px-4 py-2 font-medium text-charcoal-600 hover:bg-charcoal-50">
          All businesses
        </Link>
        <Link href="/dashboard/admin/users" className="rounded-full border border-charcoal-200 px-4 py-2 font-medium text-charcoal-600 hover:bg-charcoal-50">
          Users
        </Link>
        <Link href="/dashboard/admin/settings" className="rounded-full border border-charcoal-200 px-4 py-2 font-medium text-charcoal-600 hover:bg-charcoal-50">
          Platform settings
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users className="h-5 w-5" />} label="Users" value={userCount} />
        <Stat icon={<Store className="h-5 w-5" />} label="Approved businesses" value={approvedBusinesses} />
        <Stat icon={<ClipboardList className="h-5 w-5" />} label="Quotations" value={quotationCount} />
        <Stat icon={<ShoppingBag className="h-5 w-5" />} label="Orders" value={orderCount} />
      </div>

      <section className="mt-10">
        <h2 className="font-semibold text-charcoal-800">Vendor verification queue</h2>
        <div className="mt-3 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
          {pendingBusinesses.length === 0 && (
            <p className="p-6 text-sm text-charcoal-500">No businesses awaiting verification.</p>
          )}
          {pendingBusinesses.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold text-charcoal-900">{b.name}</p>
                <p className="text-xs text-charcoal-500">
                  {b.category} · Owner: {b.owner.firstName} {b.owner.lastName} ({b.owner.email}) ·{" "}
                  {b.branches.length} branch{b.branches.length !== 1 ? "es" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone="warning">Pending</Badge>
                <AdminBusinessActions businessId={b.id} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">{icon}</div>
      <p className="mt-3 text-2xl font-semibold text-charcoal-900">{value}</p>
      <p className="text-sm text-charcoal-500">{label}</p>
    </div>
  );
}

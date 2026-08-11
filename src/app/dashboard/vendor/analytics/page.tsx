import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatZAR } from "@/lib/utils";
import { TrendingUp, ClipboardCheck, Clock, Star } from "lucide-react";

export default async function VendorAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await prisma.business.findFirst({
    where: { OR: [{ ownerId: user.id }, { staff: { some: { userId: user.id, isActive: true } } }] }
  });
  if (!business) return null;

  const [completedOrders, totalQuotations, acceptedQuotations, topItems, branchOrderCounts] = await Promise.all([
    prisma.order.findMany({ where: { businessId: business.id, status: "COMPLETED" } }),
    prisma.quotation.count({ where: { businessId: business.id } }),
    prisma.quotation.count({ where: { businessId: business.id, status: { in: ["ACCEPTED", "PAYMENT_PENDING", "PAID", "SCHEDULED", "IN_PREPARATION", "READY", "COMPLETED"] } } }),
    prisma.orderItem.groupBy({
      by: ["nameSnapshot"],
      where: { order: { businessId: business.id } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5
    }),
    prisma.order.groupBy({ by: ["branchId"], where: { businessId: business.id }, _count: true })
  ]);

  const revenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const acceptanceRate = totalQuotations > 0 ? Math.round((acceptedQuotations / totalQuotations) * 100) : 0;
  const branches = await prisma.branch.findMany({ where: { businessId: business.id } });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Analytics</h1>
      <p className="mt-1 text-charcoal-500">{business.name} — performance across all branches.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="Completed revenue" value={formatZAR(revenue)} />
        <Stat icon={<ClipboardCheck className="h-5 w-5" />} label="Quotation acceptance rate" value={`${acceptanceRate}%`} />
        <Stat icon={<Clock className="h-5 w-5" />} label="Completed orders" value={String(completedOrders.length)} />
        <Stat icon={<Star className="h-5 w-5" />} label="Average rating" value={Number(business.avgRating).toFixed(1)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
          <h2 className="font-semibold text-charcoal-800">Top selling items</h2>
          <div className="mt-3 space-y-2">
            {topItems.length === 0 && <p className="text-sm text-charcoal-400">No sales data yet.</p>}
            {topItems.map((item) => (
              <div key={item.nameSnapshot} className="flex items-center justify-between text-sm">
                <span className="text-charcoal-700">{item.nameSnapshot}</span>
                <span className="font-medium text-charcoal-900">{item._sum.quantity} sold</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
          <h2 className="font-semibold text-charcoal-800">Orders by branch</h2>
          <div className="mt-3 space-y-2">
            {branchOrderCounts.length === 0 && <p className="text-sm text-charcoal-400">No orders yet.</p>}
            {branchOrderCounts.map((row) => {
              const branch = branches.find((b) => b.id === row.branchId);
              return (
                <div key={row.branchId} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal-700">{branch?.name ?? "Unknown branch"}</span>
                  <span className="font-medium text-charcoal-900">{row._count} orders</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">{icon}</div>
      <p className="mt-3 text-2xl font-semibold text-charcoal-900">{value}</p>
      <p className="text-sm text-charcoal-500">{label}</p>
    </div>
  );
}

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatZAR } from "@/lib/utils";
import { ClipboardList, MapPin, UtensilsCrossed, TrendingUp } from "lucide-react";

export default async function VendorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await prisma.business.findFirst({
    where: {
      OR: [{ ownerId: user.id }, { staff: { some: { userId: user.id, isActive: true } } }]
    },
    include: {
      branches: true,
      _count: { select: { quotations: true, menuItems: true } }
    }
  });

  if (!business) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-charcoal-900">No business yet</h1>
        <p className="mt-2 text-charcoal-500">
          You haven&apos;t registered a business.{" "}
          <Link href="/vendors/join" className="font-semibold text-amber-700">
            Start onboarding
          </Link>
          .
        </p>
      </div>
    );
  }

  const pendingQuotations = await prisma.quotation.count({
    where: { businessId: business.id, status: { in: ["PENDING", "VIEWED"] } }
  });
  const activeOrders = await prisma.order.count({
    where: { businessId: business.id, status: { in: ["PAID", "SCHEDULED", "IN_PREPARATION", "READY"] } }
  });
  const recentQuotations = await prisma.quotation.findMany({
    where: { businessId: business.id },
    include: { buyer: true, branch: true },
    orderBy: { createdAt: "desc" },
    take: 6
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal-900">{business.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-charcoal-500">
            <Badge tone={business.status === "APPROVED" ? "success" : "warning"}>{business.status.replaceAll("_", " ")}</Badge>
            {business.branches.length} branch{business.branches.length !== 1 ? "es" : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm md:hidden">
        <Link href="/dashboard/vendor/settings" className="rounded-full border border-charcoal-200 px-4 py-2 font-medium text-charcoal-600 hover:bg-charcoal-50">
          Business settings
        </Link>
        <Link href="/dashboard/vendor/staff" className="rounded-full border border-charcoal-200 px-4 py-2 font-medium text-charcoal-600 hover:bg-charcoal-50">
          Staff &amp; roles
        </Link>
        <Link href="/dashboard/vendor/promotions" className="rounded-full border border-charcoal-200 px-4 py-2 font-medium text-charcoal-600 hover:bg-charcoal-50">
          Promotions
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Pending quotations" value={pendingQuotations} href="/dashboard/vendor/quotations" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Active orders" value={activeOrders} href="/dashboard/vendor/orders" />
        <StatCard icon={<UtensilsCrossed className="h-5 w-5" />} label="Menu items" value={business._count.menuItems} href="/dashboard/vendor/menu" />
        <StatCard icon={<MapPin className="h-5 w-5" />} label="Branches" value={business.branches.length} href="/dashboard/vendor/branches" />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-charcoal-800">Recent quotation requests</h2>
          <Link href="/dashboard/vendor/quotations" className="text-sm font-semibold text-amber-700">
            View inbox
          </Link>
        </div>
        <div className="mt-3 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
          {recentQuotations.length === 0 && <p className="p-6 text-sm text-charcoal-500">No quotation requests yet.</p>}
          {recentQuotations.map((q) => (
            <Link
              key={q.id}
              href={`/dashboard/vendor/quotations/${q.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-charcoal-50"
            >
              <div>
                <p className="text-sm font-semibold text-charcoal-900">
                  {q.buyer.firstName} {q.buyer.lastName}
                </p>
                <p className="text-xs text-charcoal-500">
                  {q.reference} · {q.branch.city} · {q.eventType ?? "General order"}
                </p>
              </div>
              <span className="text-sm font-medium text-charcoal-800">{formatZAR(Number(q.total))}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">{icon}</div>
      <p className="mt-3 text-2xl font-semibold text-charcoal-900">{value}</p>
      <p className="text-sm text-charcoal-500">{label}</p>
    </Link>
  );
}

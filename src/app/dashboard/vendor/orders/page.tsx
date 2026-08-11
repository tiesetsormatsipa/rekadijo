import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatZAR } from "@/lib/utils";
import { OrderStatusControl } from "./order-status-control";
import Link from "next/link";

export default async function VendorOrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await prisma.business.findFirst({
    where: { OR: [{ ownerId: user.id }, { staff: { some: { userId: user.id, isActive: true } } }] }
  });
  if (!business) return null;

  const orders = await prisma.order.findMany({
    where: { businessId: business.id },
    include: { buyer: true, branch: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Orders</h1>
      <p className="mt-1 text-charcoal-500">Track paid orders from scheduling through completion.</p>

      <div className="mt-6 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
        {orders.length === 0 && <p className="p-6 text-sm text-charcoal-500">No orders yet.</p>}
        {orders.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/dashboard/vendor/orders/${o.id}`} className="text-sm font-semibold text-charcoal-900 hover:text-amber-700">
                {o.reference} · {o.buyer.firstName} {o.buyer.lastName}
              </Link>
              <p className="text-xs text-charcoal-500">
                {o.branch.name} · {formatZAR(Number(o.total))} ·{" "}
                {o.scheduledFor ? new Date(o.scheduledFor).toLocaleString("en-ZA") : "Not scheduled"}
              </p>
            </div>
            <OrderStatusControl orderId={o.id} status={o.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

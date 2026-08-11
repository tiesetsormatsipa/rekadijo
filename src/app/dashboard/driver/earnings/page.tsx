import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatZAR } from "@/lib/utils";
import { Wallet, Package, TrendingUp } from "lucide-react";

export const metadata = { title: "Earnings" };

export default async function DriverEarningsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return null;

  const deliveredAssignments = await prisma.driverAssignment.findMany({
    where: { driverId: profile.id, status: "DELIVERED" },
    include: { order: true },
    orderBy: { deliveredAt: "desc" }
  });

  // Delivery fee is the driver's earning per delivery in this model (tips are shown separately, paid to the order).
  const totalEarnings = deliveredAssignments.reduce((sum, a) => sum + Number(a.order.deliveryFee ?? 0), 0);
  const totalTips = deliveredAssignments.reduce((sum, a) => sum + Number(a.order.tipAmount ?? 0), 0);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeek = deliveredAssignments.filter((a) => a.deliveredAt && a.deliveredAt >= startOfWeek);
  const weekEarnings = thisWeek.reduce((sum, a) => sum + Number(a.order.deliveryFee ?? 0) + Number(a.order.tipAmount ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Earnings</h1>
      <p className="mt-1 text-charcoal-500">A summary of your completed deliveries.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-charcoal-900">{formatZAR(weekEarnings)}</p>
          <p className="text-sm text-charcoal-500">This week (fees + tips)</p>
        </div>
        <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-charcoal-900">{formatZAR(totalEarnings + totalTips)}</p>
          <p className="text-sm text-charcoal-500">All-time (fees + tips)</p>
        </div>
        <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Package className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-charcoal-900">{deliveredAssignments.length}</p>
          <p className="text-sm text-charcoal-500">Completed deliveries</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-charcoal-800">Recent deliveries</h2>
        <div className="mt-3 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
          {deliveredAssignments.length === 0 && <p className="p-6 text-sm text-charcoal-500">No completed deliveries yet.</p>}
          {deliveredAssignments.slice(0, 20).map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="font-medium text-charcoal-800">{a.order.reference}</p>
                <p className="text-xs text-charcoal-400">{a.deliveredAt ? new Date(a.deliveredAt).toLocaleString("en-ZA") : "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-charcoal-900">{formatZAR(Number(a.order.deliveryFee ?? 0) + Number(a.order.tipAmount ?? 0))}</p>
                {Number(a.order.tipAmount) > 0 && <p className="text-xs text-olive-600">incl. {formatZAR(Number(a.order.tipAmount))} tip</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-charcoal-400">
        Payouts run through a placeholder gateway during development — see the README for how to connect a real
        payment provider and payout schedule.
      </p>
    </div>
  );
}

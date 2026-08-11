import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatZAR } from "@/lib/utils";
import { OrderStatusControl } from "../order-status-control";
import { DriverDispatchPanel } from "./driver-dispatch-panel";

export default async function VendorOrderDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      buyer: true,
      branch: true,
      business: true,
      items: true,
      driverAssignment: { include: { driver: { include: { user: true } } } }
    }
  });
  if (!order) notFound();

  const isStaffOrOwner =
    order.business.ownerId === user.id ||
    (await prisma.businessStaff.findFirst({ where: { businessId: order.businessId, userId: user.id } }));
  if (!isStaffOrOwner) notFound();

  const availableDrivers = await prisma.driverProfile.findMany({
    where: { isAvailable: true },
    include: { user: true }
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal-900">
            {order.reference} · {order.buyer.firstName} {order.buyer.lastName}
          </h1>
          <p className="text-sm text-charcoal-500">{order.branch.name}</p>
        </div>
        <OrderStatusControl orderId={order.id} status={order.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Fulfillment</p>
          <p className="mt-1 font-medium text-charcoal-800">{order.fulfillmentType}</p>
        </div>
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Scheduled for</p>
          <p className="mt-1 font-medium text-charcoal-800">
            {order.scheduledFor ? new Date(order.scheduledFor).toLocaleString("en-ZA") : "Not scheduled"}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <h2 className="font-semibold text-charcoal-800">Items</h2>
        <div className="mt-3 divide-y divide-charcoal-50">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-charcoal-700">
                {item.nameSnapshot} × {item.quantity}
              </span>
              <span className="font-medium text-charcoal-900">{formatZAR(Number(item.lineTotal))}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-charcoal-100 pt-3 text-base font-semibold text-charcoal-900">
          <span>Total</span>
          <span>{formatZAR(Number(order.total))}</span>
        </div>
      </div>

      {order.fulfillmentType === "DELIVERY" && (
        <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
          <h2 className="font-semibold text-charcoal-800">Delivery dispatch</h2>
          {order.driverAssignment ? (
            <p className="mt-2 text-sm text-charcoal-600">
              Assigned to <strong>{order.driverAssignment.driver.user.firstName} {order.driverAssignment.driver.user.lastName}</strong> ·{" "}
              <Badge tone="info">{order.driverAssignment.status.replaceAll("_", " ")}</Badge>
            </p>
          ) : (
            <p className="mt-2 text-sm text-charcoal-500">No driver assigned yet.</p>
          )}
          <div className="mt-4">
            <DriverDispatchPanel
              orderId={order.id}
              drivers={availableDrivers.map((d) => ({
                id: d.id,
                name: `${d.user.firstName} ${d.user.lastName}`,
                vehicleType: d.vehicleType,
                rating: Number(d.avgRating)
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

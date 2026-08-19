import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatZAR } from "@/lib/utils";
import { haversineDistanceKm, estimateDeliveryMinutes } from "@/lib/geo";
import { ReviewForm } from "./review-form";
import { OrderActions } from "./order-actions";
import { OrderTimeline } from "@/components/order-timeline";
import { DriverCard } from "@/components/driver-card";

const BUYER_CANCELABLE_STATUSES = ["PAYMENT_PENDING", "PAID", "SCHEDULED"];

export default async function BuyerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      business: true,
      branch: { include: { business: true } },
      items: true,
      driverAssignment: {
        include: {
          driver: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });
  if (!order || order.buyerId !== user.id) notFound();

  const existingReview = await prisma.review.findFirst({
    where: { orderId: order.id, authorId: user.id, targetType: "BUSINESS" }
  });

  // Calculate delivery ETA for delivery orders
  let eta: { min: number; max: number; label: string } | null = null;
  if (order.fulfillmentType === "DELIVERY" && order.deliveryLat && order.deliveryLng) {
    const distance = haversineDistanceKm(
      { lat: Number(order.branch.latitude), lng: Number(order.branch.longitude) },
      { lat: Number(order.deliveryLat), lng: Number(order.deliveryLng) }
    );
    eta = estimateDeliveryMinutes(distance);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal-900">{order.business.name}</h1>
          <p className="text-sm text-charcoal-500">
            {order.reference} · {order.branch.name}
          </p>
        </div>
        <Link
          href={`/dashboard/buyer/orders/${order.id}/receipt`}
          className="text-xs font-semibold text-amber-700 hover:text-amber-800"
        >
          View receipt
        </Link>
      </div>

      {/* Status Badge */}
      <div className="mt-4">
        <p className="text-sm font-medium text-charcoal-700">
          Status:{" "}
          <Badge tone={order.status === "CANCELED" ? "danger" : order.status === "DELIVERED" || order.status === "COMPLETED" ? "success" : "info"}>
            {order.status.replaceAll("_", " ")}
          </Badge>
        </p>
      </div>

      {/* ETA for delivery orders */}
      {eta && order.fulfillmentType === "DELIVERY" && ["PAID", "IN_PREPARATION", "READY", "OUT_FOR_DELIVERY"].includes(order.status) && (
        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">Estimated delivery: {eta.label}</p>
        </div>
      )}

      {/* Order Timeline */}
      {order.status !== "CANCELED" && order.status !== "REFUNDED" && (
        <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-semibold text-charcoal-800">Order Status</h2>
          <OrderTimeline status={order.status} orderType={order.type} />
        </div>
      )}

      {/* Items */}
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
        <div className="mt-3 space-y-1 border-t border-charcoal-100 pt-3 text-sm">
          <div className="flex justify-between text-charcoal-500">
            <span>Subtotal</span>
            <span>{formatZAR(Number(order.subtotal))}</span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between text-charcoal-500">
              <span>Discount</span>
              <span>-{formatZAR(Number(order.discountAmount))}</span>
            </div>
          )}
          {order.deliveryFee != null && (
            <div className="flex justify-between text-charcoal-500">
              <span>Delivery fee</span>
              <span>{formatZAR(Number(order.deliveryFee))}</span>
            </div>
          )}
          {Number(order.tipAmount) > 0 && (
            <div className="flex justify-between text-charcoal-500">
              <span>Tip</span>
              <span>{formatZAR(Number(order.tipAmount))}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-charcoal-900">
            <span>Total</span>
            <span>{formatZAR(Number(order.total))}</span>
          </div>
        </div>
      </div>

      {/* Driver Card */}
      {order.driverAssignment && (
        <div className="mt-6">
          <DriverCard
            driverName={`${order.driverAssignment.driver.user.firstName} ${order.driverAssignment.driver.user.lastName}`}
            vehicleType={order.driverAssignment.driver.vehicleType}
            licensePlate={order.driverAssignment.driver.licensePlate}
            status={order.driverAssignment.status}
            currentLat={
              order.driverAssignment.driver.currentLat != null
                ? Number(order.driverAssignment.driver.currentLat)
                : null
            }
            currentLng={
              order.driverAssignment.driver.currentLng != null
                ? Number(order.driverAssignment.driver.currentLng)
                : null
            }
            deliveryLat={order.deliveryLat != null ? Number(order.deliveryLat) : null}
            deliveryLng={order.deliveryLng != null ? Number(order.deliveryLng) : null}
            orderId={order.id}
            fulfillmentType={order.fulfillmentType}
          />
        </div>
      )}

      {order.cancelReason && (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Cancelled by {order.cancelledBy?.toLowerCase()}: {order.cancelReason}
        </div>
      )}

      <OrderActions
        orderId={order.id}
        canCancel={BUYER_CANCELABLE_STATUSES.includes(order.status)}
        canReorder={order.type === "INSTANT" && ["COMPLETED", "DELIVERED"].includes(order.status)}
      />

      {order.status === "COMPLETED" && !existingReview && (
        <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
          <h2 className="font-semibold text-charcoal-800">Rate your order</h2>
          <ReviewForm orderId={order.id} hasDriver={Boolean(order.driverAssignment)} />
        </div>
      )}
      {existingReview && (
        <div className="mt-6 rounded-xl bg-olive-50 p-4 text-sm text-olive-800">Thanks — you&apos;ve already reviewed this order.</div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatZAR } from "@/lib/utils";
import { PrintButton } from "./print-button";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { business: true, branch: true, items: true, payments: true, buyer: true }
  });
  if (!order || order.buyerId !== user.id) notFound();

  const payment = order.payments.find((p) => p.status === "SUCCESS");

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-charcoal-100 bg-white p-8 shadow-card print:border-none print:shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-xl font-semibold text-charcoal-900">RekaDijo</p>
            <p className="text-xs text-charcoal-400">A TechTur Solutions product</p>
          </div>
          <p className="text-sm font-semibold text-charcoal-700">Receipt</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-charcoal-400">Order reference</p>
            <p className="font-medium text-charcoal-800">{order.reference}</p>
          </div>
          <div>
            <p className="text-charcoal-400">Date</p>
            <p className="font-medium text-charcoal-800">{new Date(order.createdAt).toLocaleString("en-ZA")}</p>
          </div>
          <div>
            <p className="text-charcoal-400">Vendor</p>
            <p className="font-medium text-charcoal-800">{order.business.name}</p>
          </div>
          <div>
            <p className="text-charcoal-400">Branch</p>
            <p className="font-medium text-charcoal-800">{order.branch.name}</p>
          </div>
          <div>
            <p className="text-charcoal-400">Billed to</p>
            <p className="font-medium text-charcoal-800">
              {order.buyer.firstName} {order.buyer.lastName}
            </p>
          </div>
          <div>
            <p className="text-charcoal-400">Payment method</p>
            <p className="font-medium text-charcoal-800">{payment ? payment.provider.replaceAll("_", " ") : "—"}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-charcoal-100 pt-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-1 text-sm">
              <span className="text-charcoal-700">
                {item.nameSnapshot} × {item.quantity}
              </span>
              <span className="text-charcoal-900">{formatZAR(Number(item.lineTotal))}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1 border-t border-charcoal-100 pt-4 text-sm">
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
          <div className="flex justify-between border-t border-charcoal-100 pt-2 text-base font-semibold text-charcoal-900">
            <span>Total paid</span>
            <span>{formatZAR(Number(order.total))}</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-charcoal-400">
          Questions about this order? Contact {order.business.name} directly, or reach TechTur Solutions support at
          techtursolutions@gmail.com.
        </p>
      </div>

      <div className="mt-4 print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}

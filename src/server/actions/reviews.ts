"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const reviewSchema = z.object({
  orderId: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
  driverRating: z.coerce.number().int().min(1).max(5).optional(),
  driverComment: z.string().optional()
});

export async function submitOrderReviewAction(input: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Please provide a valid rating." };
  const data = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { driverAssignment: { include: { driver: true } } }
  });
  if (!order || order.buyerId !== user.id) return { ok: false as const, error: "Order not found." };
  if (order.status !== "COMPLETED") return { ok: false as const, error: "You can only review completed orders." };

  const existing = await prisma.review.findFirst({
    where: { orderId: order.id, authorId: user.id, targetType: "BUSINESS" }
  });
  if (existing) return { ok: false as const, error: "You've already reviewed this order." };

  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        targetType: "BUSINESS",
        authorId: user.id,
        orderId: order.id,
        businessId: order.businessId,
        rating: data.rating,
        comment: data.comment
      }
    });

    const agg = await tx.review.aggregate({
      where: { businessId: order.businessId, targetType: "BUSINESS" },
      _avg: { rating: true },
      _count: true
    });
    await tx.business.update({
      where: { id: order.businessId },
      data: { avgRating: agg._avg.rating ?? data.rating, reviewCount: agg._count }
    });

    if (data.driverRating && order.driverAssignment) {
      await tx.review.create({
        data: {
          targetType: "DRIVER",
          authorId: user.id,
          orderId: order.id,
          targetUserId: order.driverAssignment.driver.userId,
          rating: data.driverRating,
          comment: data.driverComment
        }
      });

      const driverAgg = await tx.review.aggregate({
        where: { targetUserId: order.driverAssignment.driver.userId, targetType: "DRIVER" },
        _avg: { rating: true },
        _count: true
      });
      await tx.driverProfile.update({
        where: { id: order.driverAssignment.driverId },
        data: { avgRating: driverAgg._avg.rating ?? data.driverRating, ratingCount: driverAgg._count }
      });
    }
  });

  revalidatePath(`/dashboard/buyer/orders/${order.id}`);
  revalidatePath(`/dashboard/buyer`);
  return { ok: true as const };
}

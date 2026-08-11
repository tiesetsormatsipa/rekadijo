"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { calculateDiscount } from "@/lib/promotions";
import type { ActionResult } from "@/server/actions/auth";

export type PromoValidationResult =
  | { ok: true; promotionId: string; discountAmount: number; freeDelivery: boolean; label: string }
  | { ok: false; error: string };

export async function validatePromoCodeAction(
  code: string,
  businessId: string,
  subtotal: number
): Promise<PromoValidationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to use a promo code." };

  const promotion = await prisma.promotion.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!promotion || !promotion.isActive) return { ok: false, error: "That promo code isn't valid." };
  if (promotion.scope === "BUSINESS" && promotion.businessId !== businessId) {
    return { ok: false, error: "That code isn't valid for this vendor." };
  }
  if (promotion.expiresAt && promotion.expiresAt < new Date()) return { ok: false, error: "That promo code has expired." };
  if (promotion.startsAt > new Date()) return { ok: false, error: "That promo code isn't active yet." };

  const totalRedemptions = await prisma.promotionRedemption.count({ where: { promotionId: promotion.id } });
  if (promotion.usageLimit != null && totalRedemptions >= promotion.usageLimit) {
    return { ok: false, error: "That promo code has reached its usage limit." };
  }
  const userRedemptions = await prisma.promotionRedemption.count({ where: { promotionId: promotion.id, userId: user.id } });
  if (userRedemptions >= promotion.perUserLimit) {
    return { ok: false, error: "You've already used that promo code." };
  }

  const { discountAmount, freeDelivery } = calculateDiscount(
    {
      type: promotion.type,
      value: Number(promotion.value),
      minOrderAmount: promotion.minOrderAmount ? Number(promotion.minOrderAmount) : null,
      maxDiscount: promotion.maxDiscount ? Number(promotion.maxDiscount) : null
    },
    subtotal
  );

  if (discountAmount === 0 && !freeDelivery) {
    return {
      ok: false,
      error: promotion.minOrderAmount
        ? `This code needs a minimum order of R${Number(promotion.minOrderAmount)}.`
        : "This code doesn't apply to your order."
    };
  }

  return {
    ok: true,
    promotionId: promotion.id,
    discountAmount,
    freeDelivery,
    label:
      promotion.type === "PERCENTAGE_OFF"
        ? `${Number(promotion.value)}% off applied`
        : promotion.type === "FREE_DELIVERY"
        ? "Free delivery applied"
        : `R${Number(promotion.value)} off applied`
  };
}

const createPromoSchema = z.object({
  businessId: z.string(),
  code: z.string().min(3),
  type: z.enum(["PERCENTAGE_OFF", "AMOUNT_OFF", "FREE_DELIVERY"]),
  value: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().optional(),
  maxDiscount: z.coerce.number().optional(),
  usageLimit: z.coerce.number().int().optional(),
  perUserLimit: z.coerce.number().int().min(1).default(1),
  expiresAt: z.string().optional()
});

export async function createPromotionAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = createPromoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the promo details." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const canEdit = await hasPermission(user.id, PERMISSIONS.BUSINESS_SETTINGS_EDIT, parsed.data.businessId);
  if (!canEdit) return { ok: false, error: "Not authorized." };

  const existing = await prisma.promotion.findUnique({ where: { code: parsed.data.code.toUpperCase() } });
  if (existing) return { ok: false, error: "That promo code already exists." };

  await prisma.promotion.create({
    data: {
      code: parsed.data.code.toUpperCase(),
      scope: "BUSINESS",
      businessId: parsed.data.businessId,
      type: parsed.data.type,
      value: parsed.data.value,
      minOrderAmount: parsed.data.minOrderAmount,
      maxDiscount: parsed.data.maxDiscount,
      usageLimit: parsed.data.usageLimit,
      perUserLimit: parsed.data.perUserLimit,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined
    }
  });

  revalidatePath("/dashboard/vendor/promotions");
  return { ok: true };
}

export async function togglePromotionAction(promotionId: string) {
  const promotion = await prisma.promotion.findUnique({ where: { id: promotionId } });
  if (!promotion || !promotion.businessId) return { ok: false as const, error: "Not found." };

  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };
  const canEdit = await hasPermission(user.id, PERMISSIONS.BUSINESS_SETTINGS_EDIT, promotion.businessId);
  if (!canEdit) return { ok: false as const, error: "Not authorized." };

  await prisma.promotion.update({ where: { id: promotionId }, data: { isActive: !promotion.isActive } });
  revalidatePath("/dashboard/vendor/promotions");
  return { ok: true as const };
}

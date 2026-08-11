import type { PromotionType } from "@prisma/client";

export type PromotionLike = {
  type: PromotionType;
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
};

export type DiscountResult = { discountAmount: number; freeDelivery: boolean };

export function calculateDiscount(promotion: PromotionLike, subtotal: number): DiscountResult {
  if (promotion.minOrderAmount != null && subtotal < promotion.minOrderAmount) {
    return { discountAmount: 0, freeDelivery: false };
  }

  if (promotion.type === "FREE_DELIVERY") {
    return { discountAmount: 0, freeDelivery: true };
  }

  if (promotion.type === "PERCENTAGE_OFF") {
    let amount = subtotal * (promotion.value / 100);
    if (promotion.maxDiscount != null) amount = Math.min(amount, promotion.maxDiscount);
    return { discountAmount: Math.round(amount * 100) / 100, freeDelivery: false };
  }

  // AMOUNT_OFF
  return { discountAmount: Math.min(promotion.value, subtotal), freeDelivery: false };
}

export const TIP_PRESETS_PERCENT = [0, 10, 15, 20];

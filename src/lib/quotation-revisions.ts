import type { QuotationRevision } from "@prisma/client";

type RevisionItemSnapshot = {
  nameSnapshot: string;
  quantity: number;
  unitPrice: number;
};

export type QuotationRevisionView = {
  revisionNo: number;
  createdAt: string;
  subtotal: number;
  deliveryFee: number | null;
  total: number;
  message?: string;
  itemsSnapshot: Array<{
    nameSnapshot: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export function mapQuotationRevisionsForComparison(revisions: QuotationRevision[]): QuotationRevisionView[] {
  return revisions.map((rev) => {
    const rawItems = rev.itemsSnapshot as RevisionItemSnapshot[];
    const itemsSnapshot = rawItems.map((item) => {
      const unitPrice = Number(item.unitPrice);
      return {
        nameSnapshot: item.nameSnapshot,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity
      };
    });

    return {
      revisionNo: rev.revisionNo,
      createdAt: rev.createdAt.toISOString(),
      subtotal: Number(rev.subtotal),
      deliveryFee: rev.deliveryFee != null ? Number(rev.deliveryFee) : null,
      total: Number(rev.total),
      message: rev.message ?? undefined,
      itemsSnapshot
    };
  });
}

export const QUOTATION_EXPIRABLE_STATUSES = ["PENDING", "VIEWED", "REVISED"] as const;

export function isQuotationExpired(expiresAt: Date | null | undefined, status: string): boolean {
  if (status === "EXPIRED") return true;
  if (!expiresAt) return false;
  return expiresAt < new Date() && QUOTATION_EXPIRABLE_STATUSES.includes(status as (typeof QUOTATION_EXPIRABLE_STATUSES)[number]);
}

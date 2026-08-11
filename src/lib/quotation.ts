import type { QuotationStatus } from "@prisma/client";

/**
 * Quotation state machine
 * ────────────────────────
 * Encodes the request → approval → payment → scheduling → fulfillment
 * flow described in the product spec. Payment is only reachable after
 * ACCEPTED, which enforces "pay only after quotation approval" at the
 * data layer, not just in the UI.
 */

export const QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ["PENDING", "CANCELED"],
  PENDING: ["VIEWED", "REVISED", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELED"],
  VIEWED: ["REVISED", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELED"],
  REVISED: ["ACCEPTED", "DECLINED", "REVISED", "EXPIRED", "CANCELED"],
  ACCEPTED: ["PAYMENT_PENDING", "CANCELED"],
  DECLINED: [],
  EXPIRED: [],
  PAYMENT_PENDING: ["PAID", "CANCELED"],
  PAID: ["SCHEDULED", "CANCELED"],
  SCHEDULED: ["IN_PREPARATION", "CANCELED"],
  IN_PREPARATION: ["READY", "CANCELED"],
  READY: ["COMPLETED", "CANCELED"],
  COMPLETED: [],
  CANCELED: []
};

export function canTransition(from: QuotationStatus, to: QuotationStatus): boolean {
  return QUOTATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: QuotationStatus, to: QuotationStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid quotation transition: ${from} → ${to}`);
  }
}

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Awaiting vendor response",
  VIEWED: "Viewed by vendor",
  REVISED: "Revised — awaiting your review",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  SCHEDULED: "Scheduled",
  IN_PREPARATION: "In preparation",
  READY: "Ready for collection/delivery",
  COMPLETED: "Completed",
  CANCELED: "Canceled"
};

export const QUOTATION_STATUS_TONE: Record<
  QuotationStatus,
  "neutral" | "warning" | "success" | "danger" | "info"
> = {
  DRAFT: "neutral",
  PENDING: "warning",
  VIEWED: "warning",
  REVISED: "info",
  ACCEPTED: "success",
  DECLINED: "danger",
  EXPIRED: "danger",
  PAYMENT_PENDING: "warning",
  PAID: "success",
  SCHEDULED: "info",
  IN_PREPARATION: "info",
  READY: "success",
  COMPLETED: "success",
  CANCELED: "danger"
};

export function generateReference(prefix: "RQ" | "RO"): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${rand}`;
}

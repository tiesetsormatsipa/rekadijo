import { prisma } from "@/lib/prisma";
import type { GlobalRole } from "@prisma/client";

/**
 * RekaDijo permission model
 * ─────────────────────────
 * Two layers work together:
 *
 * 1. GlobalRole (coarse-grained, on User): SUPERADMIN, ADMIN, VENDOR_OWNER,
 *    VENDOR_STAFF, BUYER, DRIVER. This drives which *section* of the app
 *    (which dashboard) a user can enter, and is checked first in middleware
 *    for fast route protection without a DB round trip.
 *
 * 2. Role + Permission + RolePermission + UserRole (fine-grained, custom,
 *    business-scoped): lets a vendor owner create custom roles ("Kitchen
 *    Lead", "Weekend Manager") and attach specific permissions
 *    (e.g. "quotation.approve", "menu.edit", "branch.hours.edit") — optionally
 *    scoped to one Business via UserRole.businessId. SUPERADMIN/ADMIN can
 *    also be granted custom permissions the same way for internal
 *    delegation (e.g. a support admin who can view but not suspend).
 *
 * Checks should generally go: verify GlobalRole can access the area at all,
 * then verify fine-grained Permission for the specific action within a
 * business scope.
 */

export const PERMISSIONS = {
  QUOTATION_VIEW: "quotation.view",
  QUOTATION_RESPOND: "quotation.respond", // accept / decline / revise
  MENU_EDIT: "menu.edit",
  BRANCH_EDIT: "branch.edit",
  BRANCH_AVAILABILITY_EDIT: "branch.availability.edit",
  ORDER_MANAGE: "order.manage",
  STAFF_MANAGE: "staff.manage",
  BUSINESS_SETTINGS_EDIT: "business.settings.edit",
  BUSINESS_VERIFY: "business.verify",
  BUSINESS_SUSPEND: "business.suspend",
  USER_SUSPEND: "user.suspend",
  PLATFORM_SETTINGS_EDIT: "platform.settings.edit"
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Default permission sets per StaffRole, used at seed/invite time. */
export const DEFAULT_STAFF_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  OWNER: Object.values(PERMISSIONS) as PermissionKey[],
  MANAGER: [
    PERMISSIONS.QUOTATION_VIEW,
    PERMISSIONS.QUOTATION_RESPOND,
    PERMISSIONS.MENU_EDIT,
    PERMISSIONS.BRANCH_EDIT,
    PERMISSIONS.BRANCH_AVAILABILITY_EDIT,
    PERMISSIONS.ORDER_MANAGE
  ],
  KITCHEN: [PERMISSIONS.QUOTATION_VIEW, PERMISSIONS.ORDER_MANAGE, PERMISSIONS.BRANCH_AVAILABILITY_EDIT],
  FRONT_OF_HOUSE: [PERMISSIONS.QUOTATION_VIEW, PERMISSIONS.QUOTATION_RESPOND, PERMISSIONS.ORDER_MANAGE],
  DRIVER_COORDINATOR: [PERMISSIONS.ORDER_MANAGE]
};

export function canAccessDashboard(role: GlobalRole, area: "buyer" | "vendor" | "admin" | "driver") {
  switch (area) {
    case "buyer":
      return role === "BUYER" || role === "SUPERADMIN" || role === "ADMIN";
    case "vendor":
      return role === "VENDOR_OWNER" || role === "VENDOR_STAFF" || role === "SUPERADMIN";
    case "admin":
      return role === "SUPERADMIN" || role === "ADMIN";
    case "driver":
      return role === "DRIVER" || role === "SUPERADMIN";
    default:
      return false;
  }
}

/**
 * Checks whether a user holds a given fine-grained permission, optionally
 * scoped to a business. SUPERADMIN always passes. VENDOR_OWNER always
 * passes for businesses they own (owners implicitly hold every permission
 * on their own business without needing explicit UserRole rows).
 */
export async function hasPermission(
  userId: string,
  permission: PermissionKey,
  businessId?: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { ownedBusinesses: true }
  });
  if (!user) return false;
  if (user.globalRole === "SUPERADMIN") return true;
  if (businessId && user.ownedBusinesses.some((b) => b.id === businessId)) return true;

  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      ...(businessId ? { OR: [{ businessId }, { businessId: null }] } : { businessId: null })
    },
    include: { role: { include: { permissions: { include: { permission: true } } } } }
  });

  return userRoles.some((ur) => ur.role.permissions.some((rp) => rp.permission.key === permission));
}

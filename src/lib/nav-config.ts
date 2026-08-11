import type { GlobalRole } from "@prisma/client";

export type NavItem = {
  href: string;
  label: string;
  iconName: string;
  /** Force an exact pathname match instead of a 'startsWith' check */
  exact?: boolean;
  /** Optional prefix route to explicitly ignore (e.g., ignore profile inside parent matching) */
  excludePrefix?: string;
};

export const DASHBOARD_PATH: Partial<Record<GlobalRole, string>> = {
  SUPERADMIN: "/dashboard/admin",
  ADMIN: "/dashboard/admin",
  VENDOR_OWNER: "/dashboard/vendor",
  VENDOR_STAFF: "/dashboard/vendor",
  BUYER: "/dashboard/buyer",
  DRIVER: "/dashboard/driver"
};

/** Public nav shown to everyone (guests and buyers alike) in the header and mobile drawer. */
export const PUBLIC_NAV: NavItem[] = [
  { href: "/vendors", label: "Find vendors", iconName: "Store" },
  { href: "/map", label: "Map", iconName: "Map" },
  { href: "/search", label: "Search food", iconName: "Search" },
  { href: "/how-it-works", label: "How quotations work", iconName: "ClipboardList" },
  { href: "/vendors/join", label: "Sell on RekaDijo", iconName: "UtensilsCrossed" },
  { href: "/help", label: "Help", iconName: "MessageCircle" }
];

/** Bottom tab bar for buyers/guests (mobile only). */
export const BUYER_TABS: NavItem[] = [
  { href: "/", label: "Home", iconName: "Home", exact: true },
  { href: "/map", label: "Map", iconName: "Map" },
  { href: "/search", label: "Search", iconName: "Search" },
  {
    href: "/dashboard/buyer",
    label: "Orders",
    iconName: "ShoppingBag",
    excludePrefix: "/dashboard/buyer/profile" // Safely replaces your custom functional check
  },
  { href: "/dashboard/buyer/profile", label: "Profile", iconName: "User" }
];

/** Full section nav for vendors — used for the desktop sidebar and the mobile "More" sheet. */
export const VENDOR_NAV: NavItem[] = [
  { href: "/dashboard/vendor", label: "Overview", iconName: "Home", exact: true },
  { href: "/dashboard/vendor/quotations", label: "Quotations", iconName: "ClipboardList" },
  { href: "/dashboard/vendor/orders", label: "Orders", iconName: "ShoppingBag" },
  { href: "/dashboard/vendor/menu", label: "Menu", iconName: "UtensilsCrossed" },
  { href: "/dashboard/vendor/branches", label: "Branches", iconName: "MapPin" },
  { href: "/dashboard/vendor/staff", label: "Staff & roles", iconName: "Users" },
  { href: "/dashboard/vendor/promotions", label: "Promotions", iconName: "Tag" },
  { href: "/dashboard/vendor/analytics", label: "Analytics", iconName: "BarChart3" },
  { href: "/dashboard/messages", label: "Messages", iconName: "MessageCircle" },
  { href: "/dashboard/vendor/settings", label: "Settings", iconName: "Settings" }
];

export const VENDOR_TABS: NavItem[] = [
  VENDOR_NAV[0],
  VENDOR_NAV[1],
  VENDOR_NAV[2],
  VENDOR_NAV[3]
];

export const DRIVER_NAV: NavItem[] = [
  { href: "/dashboard/driver", label: "Assignments", iconName: "Home", exact: true },
  { href: "/dashboard/driver/earnings", label: "Earnings", iconName: "Wallet" },
  { href: "/dashboard/messages", label: "Messages", iconName: "MessageCircle" },
  { href: "/dashboard/driver/profile", label: "Profile", iconName: "User" }
];

export const DRIVER_TABS: NavItem[] = DRIVER_NAV;

export const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard/admin", label: "Overview", iconName: "Home", exact: true },
  { href: "/dashboard/admin/businesses", label: "Businesses", iconName: "Store" },
  { href: "/dashboard/admin/users", label: "Users", iconName: "Users" },
  { href: "/dashboard/admin/settings", label: "Platform settings", iconName: "Settings" }
];

export const ADMIN_TABS: NavItem[] = ADMIN_NAV;

export function navForRole(role: GlobalRole | null): { tabs: NavItem[]; full: NavItem[]; area: "buyer" | "vendor" | "driver" | "admin" } {
  switch (role) {
    case "VENDOR_OWNER":
    case "VENDOR_STAFF":
      return { tabs: VENDOR_TABS, full: VENDOR_NAV, area: "vendor" };
    case "DRIVER":
      return { tabs: DRIVER_TABS, full: DRIVER_NAV, area: "driver" };
    case "ADMIN":
    case "SUPERADMIN":
      return { tabs: ADMIN_TABS, full: ADMIN_NAV, area: "admin" };
    default:
      return { tabs: BUYER_TABS, full: BUYER_TABS, area: "buyer" };
  }
}
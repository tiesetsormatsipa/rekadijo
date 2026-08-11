import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { VENDOR_NAV } from "@/lib/nav-config";

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <DashboardSidebar title="Vendor dashboard" items={VENDOR_NAV} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

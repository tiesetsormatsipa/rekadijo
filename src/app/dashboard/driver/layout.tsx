import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DRIVER_NAV } from "@/lib/nav-config";

export default function DriverDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <DashboardSidebar title="Driver dashboard" items={DRIVER_NAV} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

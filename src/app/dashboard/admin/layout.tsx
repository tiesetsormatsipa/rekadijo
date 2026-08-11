import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { ADMIN_NAV } from "@/lib/nav-config";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <DashboardSidebar title="Admin dashboard" items={ADMIN_NAV} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

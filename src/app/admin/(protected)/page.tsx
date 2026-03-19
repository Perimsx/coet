import AdminDashboardClient from "./AdminDashboardClient";
import { getAdminDashboardMetrics } from "@/features/admin/lib/dashboard-metrics";

export default async function AdminDashboardPage() {
  const metrics = await getAdminDashboardMetrics();
  return <AdminDashboardClient initialMetrics={metrics} />;
}

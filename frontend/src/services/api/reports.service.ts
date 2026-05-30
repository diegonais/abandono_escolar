import { apiClient } from "@/services/api/client";
import { type DashboardReport } from "@/types/dashboard";

export async function getDashboardReport(): Promise<DashboardReport> {
  const { data } = await apiClient.get<DashboardReport>("/reports/dashboard");
  return data;
}

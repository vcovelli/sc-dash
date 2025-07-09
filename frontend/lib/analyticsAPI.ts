import api from "@/lib/axios";
import type { Layout } from "react-grid-layout";

type ChartData = {
  chart_type: string;
  title: string;
  settings: object;
  [key: string]: unknown;
};

export const getDashboard = async () => {
  const res = await api.get("/analytics/dashboard/");
  return res.data;
};

export const createChart = async (chartData: ChartData) => {
  const res = await api.post("/analytics/chart/", chartData);
  return res.data;
};

export const updateChart = async (id: string, chartData: Partial<ChartData>) => {
  const res = await api.patch(`/analytics/chart/${id}/`, chartData);
  return res.data;
};

export const deleteChart = async (id: string) => {
  await api.delete(`/analytics/chart/${id}/`);
};

export const updateDashboardLayout = async (dashboardId: string, layout: Layout[]) => {
  await api.patch(`/analytics/dashboard/${dashboardId}/`, { layout });
};

export const markOnboardingStep = async (step: string) => {
  await api.post("/onboarding/progress/", { step });
};

export const getChartData = async (settings: { table?: string; [key: string]: unknown }) => {
  try {
    if (!settings.table) {
      throw new Error("No table specified in chart settings");
    }
    // Remove authHeaders if not needed
    const res = await api.get(`/datagrid/rows/${settings.table}/`);
    return res.data;
  } catch (error) {
    console.error("Error fetching chart data:", error);
    throw error;
  }
};

export const getAvailableTables = async () => {
  try {
    const res = await api.get("/datagrid/schemas/");
    return res.data;
  } catch (error) {
    console.error("Error fetching available tables:", error);
    return [];
  }
};

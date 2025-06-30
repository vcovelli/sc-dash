import axios from "axios";
import type { Layout } from "react-grid-layout";

type ChartData = {
  chart_type: string;
  title: string;
  settings: object;
  [key: string]: unknown;
};

// Helper to get Authorization headers
function authHeaders() {
  const access_token = localStorage.getItem("access_token");
  return access_token
    ? { headers: { Authorization: `Bearer ${access_token}` } }
    : {};
}

export const getDashboard = async () => {
  const res = await axios.get("/api/analytics/dashboard/", authHeaders());
  return res.data;
};

export const createChart = async (chartData: ChartData) => {
  const res = await axios.post("/api/analytics/chart/", chartData, authHeaders());
  return res.data;
};

export const updateChart = async (id: string, chartData: Partial<ChartData>) => {
  const res = await axios.patch(`/api/analytics/chart/${id}/`, chartData, authHeaders());
  return res.data;
};

export const deleteChart = async (id: string) => {
  await axios.delete(`/api/analytics/chart/${id}/`, authHeaders());
};

export const updateDashboardLayout = async (dashboardId: string, layout: Layout[]) => {
  await axios.patch(`/api/analytics/dashboard/${dashboardId}/`, { layout }, authHeaders());
};

export const markOnboardingStep = async (step: string) => {
  await axios.post("/api/onboarding/progress/", { step }, authHeaders());
};

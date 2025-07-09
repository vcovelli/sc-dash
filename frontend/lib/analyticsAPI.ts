import api from "@/lib/axios"; // Use your custom Axios

type ChartData = {
  chart_type: string;
  title: string;
  settings: object;
  [key: string]: unknown;
};

export const getDashboard = async () => {
  const res = await api.get("/analytics/dashboard/"); // note: no /api prefix needed
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

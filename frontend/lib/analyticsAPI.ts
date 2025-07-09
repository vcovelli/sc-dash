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

// Fetch actual data for charts from user tables
export const getChartData = async (settings: any) => {
  try {
    if (!settings.table) {
      throw new Error("No table specified in chart settings");
    }
    
    const res = await axios.get(`/api/datagrid/rows/${settings.table}/`, authHeaders());
    return res.data;
  } catch (error) {
    console.error("Error fetching chart data:", error);
    throw error;
  }
};

// Get available tables for chart configuration
export const getAvailableTables = async () => {
  try {
    const res = await axios.get("/api/datagrid/schemas/", authHeaders());
    return res.data;
  } catch (error) {
    console.error("Error fetching available tables:", error);
    return [];
  }
};

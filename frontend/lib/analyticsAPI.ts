import axios from "axios";

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

export const createChart = async (chartData) => {
  const res = await axios.post("/api/analytics/chart/", chartData, authHeaders());
  return res.data;
};

export const updateChart = async (id, chartData) => {
  const res = await axios.patch(`/api/analytics/chart/${id}/`, chartData, authHeaders());
  return res.data;
};

export const deleteChart = async (id) => {
  await axios.delete(`/api/analytics/chart/${id}/`, authHeaders());
};

export const updateDashboardLayout = async (dashboardId, layout) => {
  await axios.patch(`/api/analytics/dashboard/${dashboardId}/`, { layout }, authHeaders());
};

export const markOnboardingStep = async (step) => {
  await axios.post("/api/onboarding/progress/", { step }, authHeaders());
};

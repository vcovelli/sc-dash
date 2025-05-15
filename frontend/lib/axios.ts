import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.42:8000",
});

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refresh_token")
    ) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post("http://192.168.1.42:8000/auth/token/refresh/", {
          refresh: localStorage.getItem("refresh_token"),
        });

        localStorage.setItem("access_token", refreshRes.data.access);
        originalRequest.headers.Authorization = `Bearer ${refreshRes.data.access}`;
        return api(originalRequest); // Retry original request
      } catch (refreshError) {
        console.error("Refresh failed", refreshError);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

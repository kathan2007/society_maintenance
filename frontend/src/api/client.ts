import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { API_BASE_URL } from "../config/api";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Generous 120s timeout so login and server requests have plenty of time
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach JWT
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 & retry silently on initial network hiccup
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retryCount?: number }) | undefined;

    // Retry once silently if connection is establishing or timeout occurred
    if (config && (!error.response || error.code === "ECONNABORTED")) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < 2) {
        config._retryCount += 1;
        await new Promise((r) => setTimeout(r, 2000));
        return apiClient.request(config);
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if not already on the login or register page
      if (window.location.pathname !== "/" && window.location.pathname !== "/register") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

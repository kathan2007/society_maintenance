import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { API_BASE_URL } from "../config/api";
import toast from "react-hot-toast";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

let isWakingUp = false;
let wakeUpToastId: string | undefined;

// Request interceptor — attach JWT
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401, server wake-up
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (wakeUpToastId) {
      toast.dismiss(wakeUpToastId);
      wakeUpToastId = undefined;
      isWakingUp = false;
    }
    return response;
  },
  async (error: AxiosError) => {
    if (!error.response && !isWakingUp) {
      // Network error — server may be sleeping (Render free tier)
      isWakingUp = true;
      wakeUpToastId = toast.loading("🌙 Waking up server... please wait", {
        duration: 30000,
      });
      // Retry once after 5s
      await new Promise((r) => setTimeout(r, 5000));
      isWakingUp = false;
      if (wakeUpToastId) {
        toast.dismiss(wakeUpToastId);
        wakeUpToastId = undefined;
      }
      return apiClient.request(error.config!);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
